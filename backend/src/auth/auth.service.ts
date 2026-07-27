import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { User, UserDocument } from '../schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { StructuredLogger } from '../common/logger/structured-logger.service';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;
const MAX_VERIFY_ATTEMPTS = 5;
const MAX_RESEND_COUNT = 5;
const RESEND_COOLDOWN_SECONDS = 60;
const LOCKOUT_MINUTES = 15;

function generateOtp(): string {
  const min = Math.pow(10, OTP_LENGTH - 1);
  const max = Math.pow(10, OTP_LENGTH) - 1;
  return crypto.randomInt(min, max + 1).toString();
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
    private eventEmitter: EventEmitter2,
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

    user.googleId = profile.googleId;
    if (profile.avatar) {
      user.avatar = profile.avatar;
    }

    user.lastLoginAt = new Date();
    await user.save();

    return user;
  }

  async validateBypassUser(email: string): Promise<UserDocument> {
    let user = await this.userModel.findOne({ email }).exec();

    if (!user) {
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

    const orQuery: Record<string, unknown>[] = [{ email }];
    if (nim) orQuery.push({ nim });

    const existingUser = await this.userModel.findOne({ $or: orQuery }).exec();
    if (existingUser) {
      if (nim && existingUser.nim === nim) {
        throw new ConflictException('NIM sudah terdaftar.');
      }
      throw new ConflictException('Email sudah terdaftar.');
    }

    const role = await this.roleModel.findOne({ slug: 'user' }).exec();
    if (!role) {
      throw new ConflictException('Role tidak ditemukan, hubungi admin.');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const rawOtp = generateOtp();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

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
      emailVerifyAttempts: 0,
      emailResendCount: 0,
      cabinetPeriod: '2026',
    });

    const savedUser = await newUser.save();

    this.eventEmitter.emit('email.verification.send', {
      to: email,
      name,
      otp: rawOtp,
      userId: savedUser._id.toString(),
    });

    this.eventEmitter.emit('audit.log', {
      actor: savedUser._id,
      actorRole: 'system',
      action: 'EMAIL_SEND',
      resourceType: 'User',
      resourceId: savedUser._id,
      resourceName: email,
      details: { type: 'registration_verification', nip: nim },
    });

    this.logger.log(
      `Registration successful for ${email}, verification email queued`,
    );

    return savedUser;
  }

  async verifyEmailCode(
    email: string,
    code: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Email tidak ditemukan.');
    }

    if (user.isEmailVerified) {
      return {
        success: true,
        message: 'Email sudah terverifikasi sebelumnya.',
      };
    }

    if (user.emailLockedUntil && new Date() < user.emailLockedUntil) {
      const remaining = Math.ceil(
        (user.emailLockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new BadRequestException(
        `Akun terkunci karena terlalu banyak percobaan gagal. Coba lagi dalam ${remaining} menit.`,
      );
    }

    if (!user.emailVerificationCode) {
      throw new BadRequestException(
        'Tidak ada kode verifikasi aktif. Silakan minta kode baru.',
      );
    }

    if (
      user.emailVerificationExpiry &&
      new Date() > user.emailVerificationExpiry
    ) {
      throw new BadRequestException(
        'Kode verifikasi telah kedaluwarsa. Silakan minta kode baru.',
      );
    }

    if (user.emailVerifyAttempts >= MAX_VERIFY_ATTEMPTS) {
      user.emailVerificationCode = undefined;
      user.emailVerificationExpiry = undefined;
      user.emailVerifyAttempts = 0;
      user.emailResendCount = 0;
      user.emailLockedUntil = new Date(
        Date.now() + LOCKOUT_MINUTES * 60 * 1000,
      );
      await user.save();

      this.eventEmitter.emit('audit.log', {
        actor: user._id,
        actorRole: 'user',
        action: 'EMAIL_VERIFY_LOCKED',
        resourceType: 'User',
        resourceId: user._id,
        resourceName: email,
        ipAddress: ip,
        userAgent,
        details: {
          reason: 'max_attempts_exceeded',
          lockedUntil: user.emailLockedUntil,
        },
      });

      throw new BadRequestException(
        `Terlalu banyak percobaan gagal. Akun dikunci selama ${LOCKOUT_MINUTES} menit.`,
      );
    }

    user.emailVerifyAttempts += 1;
    await user.save();

    const isMatch = await bcrypt.compare(code, user.emailVerificationCode);
    if (!isMatch) {
      this.eventEmitter.emit('audit.log', {
        actor: user._id,
        actorRole: 'user',
        action: 'EMAIL_VERIFY_FAILED',
        resourceType: 'User',
        resourceId: user._id,
        resourceName: email,
        ipAddress: ip,
        userAgent,
        details: {
          attempts: user.emailVerifyAttempts,
          maxAttempts: MAX_VERIFY_ATTEMPTS,
        },
      });

      const remaining = MAX_VERIFY_ATTEMPTS - user.emailVerifyAttempts;
      throw new UnauthorizedException(
        `Kode verifikasi tidak valid. Sisa percobaan: ${remaining}.`,
      );
    }

    user.isEmailVerified = true;
    user.emailVerificationCode = undefined;
    user.emailVerificationExpiry = undefined;
    user.emailVerifyAttempts = 0;
    user.emailResendCount = 0;
    user.emailLastResendAt = undefined;
    user.emailLockedUntil = undefined;
    await user.save();

    this.eventEmitter.emit('audit.log', {
      actor: user._id,
      actorRole: 'user',
      action: 'EMAIL_VERIFY_SUCCESS',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: email,
      ipAddress: ip,
      userAgent,
    });

    this.logger.log(`Email verified successfully for ${email}`);

    return {
      success: true,
      message: 'Email berhasil diverifikasi! Silakan login.',
    };
  }

  async resendVerificationCode(
    email: string,
    ip?: string,
    userAgent?: string,
  ): Promise<{ success: boolean; message: string }> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Email tidak ditemukan.');
    }

    if (user.isEmailVerified) {
      return { success: true, message: 'Email sudah terverifikasi.' };
    }

    if (user.emailLockedUntil && new Date() < user.emailLockedUntil) {
      const remaining = Math.ceil(
        (user.emailLockedUntil.getTime() - Date.now()) / 60000,
      );
      throw new BadRequestException(
        `Akun terkunci. Coba lagi dalam ${remaining} menit.`,
      );
    }

    if (user.emailResendCount >= MAX_RESEND_COUNT) {
      user.emailLockedUntil = new Date(
        Date.now() + LOCKOUT_MINUTES * 60 * 1000,
      );
      await user.save();

      this.eventEmitter.emit('audit.log', {
        actor: user._id,
        actorRole: 'user',
        action: 'EMAIL_RESEND_LOCKED',
        resourceType: 'User',
        resourceId: user._id,
        resourceName: email,
        ipAddress: ip,
        userAgent,
        details: {
          reason: 'max_resend_exceeded',
          resendCount: user.emailResendCount,
        },
      });

      throw new BadRequestException(
        `Batas maksimal pengiriman ulang (${MAX_RESEND_COUNT}x) tercapai. Akun dikunci selama ${LOCKOUT_MINUTES} menit.`,
      );
    }

    if (user.emailLastResendAt) {
      const elapsed =
        (Date.now() - new Date(user.emailLastResendAt).getTime()) / 1000;
      if (elapsed < RESEND_COOLDOWN_SECONDS) {
        const wait = Math.ceil(RESEND_COOLDOWN_SECONDS - elapsed);
        throw new BadRequestException(
          `Tunggu ${wait} detik sebelum meminta kode baru.`,
        );
      }
    }

    const rawOtp = generateOtp();
    const hashedOtp = await bcrypt.hash(rawOtp, 10);
    const otpExpiry = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000);

    user.emailVerificationCode = hashedOtp;
    user.emailVerificationExpiry = otpExpiry;
    user.emailResendCount += 1;
    user.emailLastResendAt = new Date();
    await user.save();

    this.eventEmitter.emit('email.verification.send', {
      to: email,
      name: user.name,
      otp: rawOtp,
      userId: user._id.toString(),
    });

    this.eventEmitter.emit('audit.log', {
      actor: user._id,
      actorRole: 'user',
      action: 'EMAIL_RESEND',
      resourceType: 'User',
      resourceId: user._id,
      resourceName: email,
      ipAddress: ip,
      userAgent,
      details: {
        resendCount: user.emailResendCount,
        maxResends: MAX_RESEND_COUNT,
      },
    });

    this.logger.log(
      `Verification code resent to ${email} (attempt ${user.emailResendCount}/${MAX_RESEND_COUNT})`,
    );

    return {
      success: true,
      message: `Kode konfirmasi baru telah dikirimkan ke email ${email}.`,
    };
  }

  async getVerificationStatus(email: string): Promise<{
    isVerified: boolean;
    resendCount: number;
    maxResends: number;
    isLocked: boolean;
    lockedUntil?: Date;
  }> {
    const user = await this.userModel.findOne({ email }).exec();
    if (!user) {
      throw new UnauthorizedException('Email tidak ditemukan.');
    }

    const isLocked =
      !!user.emailLockedUntil && new Date() < user.emailLockedUntil;

    return {
      isVerified: user.isEmailVerified,
      resendCount: user.emailResendCount,
      maxResends: MAX_RESEND_COUNT,
      isLocked,
      lockedUntil: user.emailLockedUntil,
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
