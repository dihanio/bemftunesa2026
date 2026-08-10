import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Role, RoleDocument } from '../schemas/role.schema';
import { User, UserDocument } from '../schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { StructuredLogger } from '../common/logger/structured-logger.service';

const ALLOWED_EMAIL_DOMAINS = new Set(['mhs.unesa.ac.id', 'unesa.ac.id']);

function isAllowedUnesaEmail(email: string): boolean {
  const normalized = email.trim().toLowerCase();
  const at = normalized.lastIndexOf('@');
  if (at < 0) return false;
  const domain = normalized.slice(at + 1);
  return ALLOWED_EMAIL_DOMAINS.has(domain);
}

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new StructuredLogger();

  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {
    this.logger.setContext('AuthService');
  }

  async validateGoogleUser(profile: GoogleProfile): Promise<UserDocument> {
    let user = await this.userModel
      .findOne({ googleId: profile.googleId })
      .exec();

    if (!user) {
      user = await this.userModel.findOne({ email: profile.email }).exec();
    }

    if (!user) {
      const superAdminEmail = this.configService.get<string>('ADMIN_EMAIL');
      const isSuperAdmin =
        superAdminEmail &&
        profile.email.toLowerCase() === superAdminEmail.toLowerCase();

      const roleSlug = isSuperAdmin ? 'super_admin' : 'user';
      let defaultRole = await this.roleModel.findOne({ slug: roleSlug }).exec();
      if (!defaultRole) {
        defaultRole = await this.roleModel.findOne().exec();
      }
      if (!defaultRole) {
        throw new UnauthorizedException(
          'System is not initialized. Role table is empty.',
        );
      }

      user = await this.userModel.create({
        name: profile.name,
        email: profile.email,
        googleId: profile.googleId,
        avatar: profile.avatar || '',
        isActive: true,
        role: defaultRole._id,
        cabinetPeriod: '2026',
        position: isSuperAdmin ? 'Super Administrator' : 'Mahasiswa Baru',
      });
    }

    if (!user.isActive) {
      const superAdminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (
        superAdminEmail &&
        user.email.toLowerCase() === superAdminEmail.toLowerCase()
      ) {
        const superRole = await this.roleModel
          .findOne({ slug: 'super_admin' })
          .exec();
        if (superRole) user.role = superRole._id;
        user.position = 'Super Administrator';
      } else {
        // Maba baru/aktif ulang: jadi role user (maba) + langsung aktif, lanjut onboarding.
        const mabaRole = await this.roleModel.findOne({ slug: 'user' }).exec();
        if (mabaRole) user.role = mabaRole._id;
        user.position = 'Mahasiswa Baru';
      }
      user.isActive = true;
      await user.save();
    }

    if (!isAllowedUnesaEmail(user.email)) {
      throw new UnauthorizedException(
        'Gunakan email resmi UNESA (@mhs.unesa.ac.id atau @unesa.ac.id).',
      );
    }

    user.googleId = profile.googleId;
    if (profile.avatar) {
      user.avatar = profile.avatar;
    }

    user.lastLoginAt = new Date();
    await user.save();

    return user;
  }

  async validateMabaLogin(email: string, pass: string): Promise<UserDocument> {
    if (!isAllowedUnesaEmail(email)) {
      throw new UnauthorizedException(
        'Gunakan email resmi UNESA (@mhs.unesa.ac.id atau @unesa.ac.id).',
      );
    }
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Email tidak ditemukan.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Akun dinonaktifkan.');
    }

    if (user.password && user.password.startsWith('$2b$')) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Password salah.');
      }
    } else {
      throw new UnauthorizedException('Password salah.');
    }

    // updateOne (bukan save()) — hanya tulis lastLoginAt, hindari menulis ulang
    // seluruh dokumen + validasi schema pada setiap login (ribuan maba serentak).
    await this.userModel
      .updateOne({ _id: user._id }, { $set: { lastLoginAt: new Date() } })
      .exec();

    return user;
  }

  generateTokens(
    user: UserDocument,
    permissions: string[],
    roleSlug?: string,
    roleId?: string,
  ) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      permissions,
      roleSlug,
      roleId,
    };

    const expiresInConfig = this.configService.get<string>(
      'JWT_EXPIRES_IN',
      '604800',
    );
    const expiresIn = /^\d+$/.test(expiresInConfig)
      ? parseInt(expiresInConfig, 10)
      : expiresInConfig;

    const accessToken = this.jwtService.sign(payload, {
      expiresIn: expiresIn as import('@nestjs/jwt').JwtSignOptions['expiresIn'],
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: 2592000,
    });

    return { accessToken, refreshToken, user };
  }

  async generateTokensWithPermissions(user: UserDocument) {
    const { permissions, roleSlug, roleId } = await this.getPermissionsForUser(
      user._id,
    );

    return this.generateTokens(user, permissions, roleSlug, roleId);
  }

  private async getPermissionsForUser(
    userId: import('mongoose').Types.ObjectId,
  ): Promise<{ permissions: string[]; roleSlug?: string; roleId?: string }> {
    const populatedUser = await this.userModel
      .findById(userId)
      .populate<{
        role: RoleDocument & { permissions: { name: string }[] };
      }>({
        path: 'role',
        populate: { path: 'permissions' },
      })
      .lean()
      .exec();

    const role = populatedUser?.role;
    const permissions =
      role?.permissions?.map((p) => (p as unknown as { name: string }).name) ||
      [];

    return {
      permissions,
      roleSlug: role?.slug,
      roleId: role?._id?.toString(),
    };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{
        sub: string;
        permissions?: string[];
        roleSlug?: string;
        roleId?: string;
      }>(refreshToken);
      const user = await this.userModel.findById(payload.sub).exec();

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      user.lastLoginAt = new Date();
      await user.save();

      const { permissions, roleSlug, roleId } =
        await this.getPermissionsForUser(user._id);

      return this.generateTokens(user, permissions, roleSlug, roleId);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async updateMabaProfile(
    userId: string,
    payload: { studyProgram?: string; avatar?: string },
  ): Promise<UserDocument> {
    const user = await this.userModel.findById(userId).exec();
    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan.');
    }

    if (payload.studyProgram) user.studyProgram = payload.studyProgram;
    if (payload.avatar) user.avatar = payload.avatar;

    const saved = await user.save();
    // Jangan kembalikan hash password ke client (sama seperti getProfile).
    saved.password = undefined;
    return saved;
  }

  async updateMabaProfileByEmail(
    email: string,
    payload: { studyProgram?: string; avatar?: string },
  ): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('User tidak ditemukan.');
    }

    if (payload.studyProgram) user.studyProgram = payload.studyProgram;
    if (payload.avatar) user.avatar = payload.avatar;

    const saved = await user.save();
    // Jangan kembalikan hash password ke client (sama seperti getProfile).
    saved.password = undefined;
    return saved;
  }

  async switchRole(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    const { permissions, roleSlug, roleId } = await this.getPermissionsForUser(
      user._id,
    );

    return this.generateTokens(user, permissions, roleSlug, roleId);
  }

  async getProfile(userId: string) {
    return (
      this.userModel
        .findById(userId)
        // Jangan bocorkan hash password ke client (sebelumnya auth/me
        // mengembalikan password hash!). .lean() + hapus populate('avatar')
        // (avatar = string, bukan ref) — hasil: ~6x lebih cepat di beban konkuren
        // (dashboard yang pakai lean membuktikan: 100 req = 0.66s vs auth/me 4.1s).
        .select('-password')
        .populate({ path: 'role', populate: { path: 'permissions' } })
        .populate('department')
        .populate('pkkmbGroup')
        .lean()
        .exec()
    );
  }

  async validateUserByNim(nim: string) {
    return this.userModel
      .findOne({ nim })
      .populate('pkkmbGroup')
      .populate('department')
      .exec();
  }
}
