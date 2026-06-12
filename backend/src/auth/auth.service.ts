import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { OAuth2Client } from 'google-auth-library';
import { ConfigService } from '@nestjs/config';
import { User, UserDocument } from '../database/schema/users';
import { UserSession } from '../database/schema/security';
import { PermissionsService } from '../permissions/permissions.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly googleClient: OAuth2Client;
  private readonly googleClientId: string;
  private readonly initialAdminEmail: string | undefined;

  constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    @InjectModel(UserSession.name)
    private readonly userSessionModel: Model<UserSession>,
    private readonly permissionsService: PermissionsService,
  ) {
    this.googleClientId =
      this.configService.get<string>('GOOGLE_CLIENT_ID') || '';
    this.initialAdminEmail = this.configService.get<string>(
      'INITIAL_ADMIN_EMAIL',
    );
    this.googleClient = new OAuth2Client(this.googleClientId);
  }

  async googleLogin(token: string) {
    // 1. Verify Google ID token with signature, audience, and expiry validation
    const payload = await this.verifyGoogleToken(token);

    // 2. Validate UNESA email domain
    const email = payload.email;
    this.validateUnesaEmail(email);

    // 3. Find or create internal user
    const user = await this.findOrCreateUser(
      email,
      payload.name,
      payload.picture,
    );

    // 4. Check if user is active
    if (!user || !user.isActive) {
      throw new UnauthorizedException('Akun Anda telah dinonaktifkan.');
    }

    // 5. Build and return auth response
    return this.buildAuthResponse(user);
  }

  // --- Private Helpers ---

  private async verifyGoogleToken(
    token: string,
  ): Promise<{ email: string; name?: string; picture?: string }> {
    try {
      let payload: any;

      if (token.startsWith('ya29.')) {
        const response = await fetch(
          `https://www.googleapis.com/oauth2/v3/userinfo?access_token=${token}`,
        );
        if (!response.ok) {
          throw new UnauthorizedException('Token akses Google tidak valid.');
        }
        payload = await response.json();
      } else {
        const ticket = await this.googleClient.verifyIdToken({
          idToken: token,
          audience: this.googleClientId,
        });
        payload = ticket.getPayload();
      }

      if (!payload || !payload.email) {
        throw new UnauthorizedException(
          'Token Google tidak valid: email tidak ditemukan.',
        );
      }

      if (!payload.email_verified) {
        throw new UnauthorizedException('Email Google belum diverifikasi.');
      }

      return {
        email: payload.email,
        name: payload.name,
        picture: payload.picture,
      };
    } catch (error: unknown) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      this.logger.error(
        `Google token verification failed: ${(error as Error).message}`,
      );
      throw new UnauthorizedException(
        'Gagal memverifikasi token Google. Pastikan Anda login menggunakan akun Google yang valid.',
      );
    }
  }

  private validateUnesaEmail(email: string): void {
    const isMhs = email.endsWith('@mhs.unesa.ac.id');
    const isStaff = email.endsWith('@unesa.ac.id');

    if (!isMhs && !isStaff) {
      throw new UnauthorizedException(
        'Akses ditolak. Silakan login menggunakan Google SSO Akun UNESA resmi!',
      );
    }

    // If student email, validate NIM format pattern
    if (isMhs) {
      const mhsPattern = /^[a-zA-Z0-9.-]+\.[0-9]{3}@mhs\.unesa\.ac\.id$/;
      const nimPattern = /^[0-9]+@mhs\.unesa\.ac\.id$/;
      if (!mhsPattern.test(email) && !nimPattern.test(email)) {
        throw new UnauthorizedException(
          'Format email UNESA Anda tidak valid (gunakan format nama.3digitNIM@mhs.unesa.ac.id atau NIM@mhs.unesa.ac.id).',
        );
      }
    }
  }

  private async findOrCreateUser(
    email: string,
    name?: string,
    avatar?: string,
  ): Promise<UserDocument> {
    let user = await this.userModel.findOne({ email }).populate('departmentId');

    if (!user) {
      // Determine initial role — admin email comes from env var, not hardcoded
      const initialRole =
        this.initialAdminEmail && email === this.initialAdminEmail
          ? 'KaBEM'
          : 'Guest';
      const newUser = await this.userModel.create({
        email,
        name: name || 'User BEM FT',
        avatar,
        role: initialRole,
        isActive: true,
        lastLogin: new Date(),
      });
      user = await this.userModel
        .findById(newUser._id)
        .populate('departmentId');
    } else {
      // Update last login
      user.lastLogin = new Date();

      // Promote initial admin if configured via env
      if (
        this.initialAdminEmail &&
        email === this.initialAdminEmail &&
        user.role !== 'KaBEM'
      ) {
        user.role = 'KaBEM';
      }

      // Update avatar if not set
      if (avatar && !user.avatar) {
        user.avatar = avatar;
      }

      await user.save();
      if (!user.populated('departmentId')) {
        await user.populate('departmentId');
      }
    }

    if (!user) {
      throw new UnauthorizedException(
        'Gagal membuat atau menemukan akun pengguna.',
      );
    }

    return user;
  }

  private async buildAuthResponse(user: UserDocument) {
    const roles = [user.role].filter(Boolean);
    const [permissions, rolePermissions] = await Promise.all([
      this.permissionsService.getEffectivePermissions(user._id.toString()),
      this.permissionsService.getPermissionsMapForUser(
        user._id.toString(),
        roles,
      ),
    ]);

    const jwtPayload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      roles,
    };
    const accessToken = this.jwtService.sign(jwtPayload);

    // Create refresh token
    const refreshToken = crypto.randomBytes(40).toString('hex');
    const refreshTokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days

    await this.userSessionModel.create({
      userId: user._id,
      refreshTokenHash,
      status: 'active',
      expiresAt,
    });

    const dept = user.departmentId as unknown as {
      _id?: Types.ObjectId;
      name?: string;
      code?: string;
    } | null;

    return {
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        roles,
        permissions,
        rolePermissions,
        avatar: user.avatar,
        departmentId: dept?._id || user.departmentId || null,
        departmentName: dept?.name || null,
        departmentCode: dept?.code || null,
      },
    };
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  async refreshTokens(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    const session = await this.userSessionModel
      .findOne({
        refreshTokenHash: hash,
        status: 'active',
        expiresAt: { $gt: new Date() },
      })
      .exec();

    if (!session) {
      throw new UnauthorizedException('Sesi tidak valid atau telah berakhir.');
    }

    const user = await this.userModel
      .findById(session.userId)
      .populate('departmentId')
      .exec();
    if (!user || !user.isActive) {
      throw new UnauthorizedException(
        'Akun Anda telah dinonaktifkan atau tidak ditemukan.',
      );
    }

    // Refresh Token Rotation (RTR) - revoke current, issue new
    session.status = 'revoked';
    session.revokedAt = new Date();
    await session.save();

    // Create a new session
    const newRefreshToken = crypto.randomBytes(40).toString('hex');
    const newHash = this.hashToken(newRefreshToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.userSessionModel.create({
      userId: user._id,
      refreshTokenHash: newHash,
      status: 'active',
      expiresAt,
    });

    // Generate new access token
    const roles = [user.role].filter(Boolean);
    const jwtPayload = {
      sub: user._id,
      email: user.email,
      role: user.role,
      roles,
    };
    const accessToken = this.jwtService.sign(jwtPayload);

    return {
      accessToken,
      refreshToken: newRefreshToken,
    };
  }

  async logout(refreshToken: string) {
    const hash = this.hashToken(refreshToken);
    await this.userSessionModel.updateOne(
      { refreshTokenHash: hash },
      { $set: { status: 'revoked', revokedAt: new Date() } },
    );
  }
}
