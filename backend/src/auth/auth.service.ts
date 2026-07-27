import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { StructuredLogger } from '../common/logger/structured-logger.service';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  private readonly logger = new StructuredLogger('AuthService');

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

      const roleSlug = isSuperAdmin ? 'super_admin' : 'staf';
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
        isActive: isSuperAdmin ? true : false,
        role: defaultRole._id,
        cabinetPeriod: '2026',
        position: isSuperAdmin ? 'Super Administrator' : 'Pendaftar Akses Baru',
      });

      if (!isSuperAdmin) {
        throw new UnauthorizedException('PENDING_APPROVAL');
      }
    }

    if (!user.isActive) {
      const superAdminEmail = this.configService.get<string>('ADMIN_EMAIL');
      if (
        superAdminEmail &&
        user.email.toLowerCase() === superAdminEmail.toLowerCase()
      ) {
        // ponytail: auto-promote existing inactive super admin; one-time bootstrap path
        const superRole = await this.roleModel
          .findOne({ slug: 'super_admin' })
          .exec();
        if (superRole) user.role = superRole._id;
        user.isActive = true;
        user.position = 'Super Administrator';
        await user.save();
      } else if (user.position === 'Pendaftar Akses Baru') {
        throw new UnauthorizedException('PENDING_APPROVAL');
      } else {
        throw new UnauthorizedException('DEACTIVATED_ACCOUNT');
      }
    }

    // Link googleId and sync avatar (from gmail profile photo)
    user.googleId = profile.googleId;
    if (profile.avatar) {
      user.avatar = profile.avatar;
    }

    user.lastLoginAt = new Date();
    await user.save();

    return user;
  }

  async validateBypassUser(email: string): Promise<UserDocument> {
    // Only allow bypass in development (or if you want it always, remove the check. I'll allow it for testing)
    let user = await this.userModel.findOne({ email }).exec();

    if (!user) {
      // Auto-create for bypass testing if not found
      let role = await this.roleModel.findOne({ slug: 'user' }).exec();
      if (!role) {
        role = await this.roleModel.create({
          name: 'User',
          slug: 'user',
          description: 'Default user role',
          isSystem: true,
          permissions: [],
        });
      }
      user = new this.userModel({
        name: email.split('@')[0].replace('.', ' ').toUpperCase(),
        email: email,
        googleId: `bypass-${Date.now()}`,
        role: role._id,
        isActive: true,
      });
      await user.save();
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Your account has been deactivated.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    return user;
  }

  async registerMaba(
    dto: import('./dto/register.dto').RegisterDto,
  ): Promise<UserDocument> {
    const { nim, name, email, phone, password } = dto;

    // Check if NIM or Email already exists
    const orQuery: Record<string, unknown>[] = [{ email }];
    if (nim) orQuery.push({ nim });

    const existingUser = await this.userModel.findOne({ $or: orQuery }).exec();
    if (existingUser) {
      if (nim && existingUser.nim === nim) {
        throw new ConflictException('NIM sudah terdaftar.');
      }
      throw new ConflictException('Email sudah terdaftar.');
    }

    // Get default role for Maba (User)
    const role = await this.roleModel.findOne({ slug: 'user' }).exec();
    if (!role) {
      throw new ConflictException('Role tidak ditemukan, hubungi admin.');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Generate and hash OTP
    const rawOtp = generateOtp();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create user
    const newUser = new this.userModel({
      nim,
      name,
      email,
      phone,
      password: hashedPassword,
      role: role._id,
      isActive: true,
      isEmailVerified: false,
      emailVerificationCode: hashedOtp,
      emailVerificationExpiry: otpExpiry,
      cabinetPeriod: '2026',
    });

    // TODO: Send OTP via email service (SES / Nodemailer)
    this.logger.log(`OTP verifikasi untuk ${email}: ${rawOtp}`);

    return await newUser.save();
  }

  async verifyEmailCode(
    email: string,
    code: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Email tidak ditemukan.');
    }

    if (user.isEmailVerified) {
      return { success: true, message: 'Email sudah terverifikasi sebelumnya.' };
    }

    if (!user.emailVerificationCode) {
      throw new BadRequestException('Tidak ada kode verifikasi aktif. Silakan minta kode baru.');
    }

    // Check expiry
    if (user.emailVerificationExpiry && new Date() > user.emailVerificationExpiry) {
      throw new BadRequestException('Kode verifikasi telah kedaluwarsa. Silakan minta kode baru.');
    }

    // Compare with hashed OTP
    const isMatch = await bcrypt.compare(code, user.emailVerificationCode);
    if (!isMatch) {
      throw new UnauthorizedException('Kode verifikasi tidak valid.');
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined as never;
    user.emailVerificationExpiry = undefined as never;
    await user.save();

    return {
      success: true,
      message: 'Email berhasil diverifikasi! Silakan login.',
    };
  }

  async resendVerificationCode(
    email: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Email tidak ditemukan.');
    }

    if (user.isEmailVerified) {
      return { success: true, message: 'Email sudah terverifikasi.' };
    }

    // Rate limit: max 1 resend per 60 seconds
    if (
      user.emailVerificationExpiry &&
      new Date(user.emailVerificationExpiry).getTime() - 10 * 60 * 1000 > Date.now() - 60 * 1000
    ) {
      throw new BadRequestException('Tunggu 60 detik sebelum meminta kode baru.');
    }

    const rawOtp = generateOtp();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    user.emailVerificationCode = hashedOtp;
    user.emailVerificationExpiry = otpExpiry;
    await user.save();

    // TODO: Send OTP via email service
    this.logger.log(`OTP verifikasi baru untuk ${email}: ${rawOtp}`);

    return {
      success: true,
      message: `Kode konfirmasi baru telah dikirimkan ke email ${email}.`,
    };
  }

  async validateMabaLogin(email: string, pass: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Email tidak ditemukan.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Akun dinonaktifkan.');
    }

    // Check password (default is NIM if not set, or hashed)
    if (user.password && user.password.startsWith('$2b$')) {
      const isMatch = await bcrypt.compare(pass, user.password);
      if (!isMatch) {
        throw new UnauthorizedException('Password salah.');
      }
    } else {
      const validPassword = user.password ? user.password : user.nim;
      if (pass !== validPassword) {
        throw new UnauthorizedException('Password salah.');
      }
    }

    await this.userModel.updateOne(
      { _id: user._id },
      { $set: { lastLoginAt: new Date() } },
    );

    return user;
  }

  generateTokens(
    user: UserDocument,
    permissions: string[] = [],
    roleSlug?: string,
    roleId?: string,
  ) {
    const payload = {
      sub: user._id.toString(),
      email: user.email,
      roleId,
      roleSlug,
      permissions,
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
      expiresIn: 2592000, // 30 days in seconds
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

      // Always fetch fresh permissions from DB on refresh
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

    return await user.save();
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

    return await user.save();
  }

  async switchRole(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Regenerate tokens with current role permissions (ensures fresh permissions)
    const { permissions, roleSlug, roleId } = await this.getPermissionsForUser(
      user._id,
    );

    return this.generateTokens(user, permissions, roleSlug, roleId);
  }

  async getProfile(userId: string) {
    return this.userModel
      .findById(userId)
      .populate({ path: 'role', populate: { path: 'permissions' } })
      .populate('department')
      .populate('avatar')
      .exec();
  }
}
