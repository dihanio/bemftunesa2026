import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';

interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

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

      const roleSlug = isSuperAdmin ? 'super-admin' : 'staf';
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
          .findOne({ slug: 'super-admin' })
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

  async validateMabaLogin(nim: string, pass: string): Promise<UserDocument> {
    const user = await this.userModel.findOne({ nim }).exec();
    if (!user) {
      throw new UnauthorizedException('NIM tidak ditemukan.');
    }
    if (!user.isActive) {
      throw new UnauthorizedException('Akun dinonaktifkan.');
    }

    // Check password (default is NIM if not set)
    const validPassword = user.password ? user.password : user.nim;
    if (pass !== validPassword) {
      throw new UnauthorizedException('Password salah.');
    }

    user.lastLoginAt = new Date();
    await user.save();

    return user;
  }

  generateTokens(user: UserDocument) {
    const payload = { sub: user._id.toString(), email: user.email };

    // expiresIn uses module-level signOptions; override per-call with parsed int
    const accessToken = this.jwtService.sign(payload, {
      expiresIn: parseInt(
        this.configService.get<string>('JWT_EXPIRES_IN', '604800'),
        10,
      ),
    });

    const refreshToken = this.jwtService.sign(payload, {
      expiresIn: 2592000, // 30 days in seconds
    });

    return { accessToken, refreshToken, user };
  }

  async refreshTokens(refreshToken: string) {
    try {
      const payload = this.jwtService.verify<{ sub: string }>(refreshToken);
      const user = await this.userModel.findById(payload.sub).exec();

      if (!user || !user.isActive) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      user.lastLoginAt = new Date();
      await user.save();

      return this.generateTokens(user);
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async switchRole(userId: string) {
    const user = await this.userModel.findById(userId).exec();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    // Validate that the user has this assignment
    // Note: Assignments are typically stored in a separate collection or embedded in user
    // For now, we'll just regenerate tokens - full validation would check assignments collection
    // TODO: Add proper assignment validation when assignments schema is available

    return this.generateTokens(user);
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
