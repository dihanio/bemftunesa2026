import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
  UnauthorizedException,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import * as crypto from 'crypto';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { ConfigService } from '@nestjs/config';
import { GoogleOauthGuard } from './guards/google-oauth.guard';
import { StructuredLogger } from '../common/logger/structured-logger.service';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

@Controller('auth')
export class AuthController {
  private readonly logger = new StructuredLogger();

  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {
    this.logger.setContext('AuthController');
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  googleLogin() {
    // Initiates Google OAuth flow
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleCallback(
    @Req() req: Request & { user?: GoogleProfile },
    @Res() res: Response,
  ) {
    const profile = req.user!;

    this.logger.log(`Google callback received for: ${profile.email}`);

    try {
      const user = await this.authService.validateGoogleUser(profile);
      this.logger.log(
        `User validated successfully: ${user.email} | Position: ${user.position}`,
      );

      const tokens = await this.authService.generateTokensWithPermissions(user);

      const isProduction =
        this.configService.get<string>('NODE_ENV') === 'production';

      // Set httpOnly cookies for security (prevent XSS)
      // Use 'none' in development for cross-origin requests (localhost:3001 → localhost:4000)
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: true, // Always true - required by browsers for sameSite: 'none'
        sameSite: isProduction ? 'lax' : 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true, // Always true - required by browsers for sameSite: 'none'
        sameSite: isProduction ? 'lax' : 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      });

      const state = req.query.state as string;
      const baseUrl =
        state === 'pkkmb'
          ? this.configService.get<string>('PKKMB_URL')
          : this.configService.get<string>('IMS_URL');
      const successUrl = `${baseUrl}/login?authenticated=true`;
      this.logger.log(`Cookies set, redirecting to: ${successUrl}`);

      res.redirect(successUrl);
      this.logger.log('Redirect response sent');
      return;
    } catch (error: unknown) {
      const err = error as Error;
      this.logger.warn(`Google auth validation error: ${err.message}`);

      const state = req.query.state as string;
      const baseUrl =
        state === 'pkkmb'
          ? this.configService.get<string>('PKKMB_URL')
          : this.configService.get<string>('IMS_URL');

      // Handle specific authentication errors by redirecting
      if (err.message === 'PENDING_APPROVAL') {
        const pendingUrl = `${baseUrl}/pending`;
        this.logger.log(`User pending approval, redirecting to: ${pendingUrl}`);
        res.redirect(pendingUrl);
        return;
      } else if (err.message === 'DEACTIVATED_ACCOUNT') {
        const deactivatedUrl = `${baseUrl}/login?error=deactivated`;
        this.logger.warn(`User deactivated, redirecting to: ${deactivatedUrl}`);

        res.redirect(deactivatedUrl);
        return;
      } else {
        const failedUrl = `${baseUrl}/login?error=auth_failed`;
        this.logger.warn(`Auth failed, redirecting to: ${failedUrl}`);

        res.redirect(failedUrl);
        return;
      }
    }
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @Get('bypass')
  bypassLogin() {
    throw new ForbiddenException('Bypass login is disabled');
  }

  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @Post('register')
  async registerMaba(@Body() registerDto: RegisterDto) {
    const user = await this.authService.registerMaba(registerDto);
    return {
      success: true,
      message: 'Pendaftaran berhasil. Silakan verifikasi email Anda.',
      data: {
        nim: user.nim,
        name: user.name,
      },
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('verify-email')
  async verifyEmailCode(
    @Body() body: { email: string; code: string },
    @Req() req: Request,
  ) {
    return await this.authService.verifyEmailCode(
      body.email,
      body.code,
      (req.headers['x-forwarded-for'] as string) || req.ip,
      req.headers['user-agent'],
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('resend-verification')
  async resendVerificationCode(
    @Body() body: { email: string },
    @Req() req: Request,
  ) {
    return await this.authService.resendVerificationCode(
      body.email,
      (req.headers['x-forwarded-for'] as string) || req.ip,
      req.headers['user-agent'],
    );
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('send-verification')
  async sendVerification(@Body() body: { email: string }) {
    return await this.authService.resendVerificationCode(body.email);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('verification-status')
  async getVerificationStatus(@Req() req: Request) {
    const email = req.query.email as string;
    if (!email) {
      throw new ForbiddenException('Email query parameter is required.');
    }
    return await this.authService.getVerificationStatus(email);
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  async updateProfile(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body()
    body: {
      studyProgram?: string;
      avatar?: string;
    },
  ) {
    const updated = await this.authService.updateMabaProfile(
      user.userId.toString(),
      body,
    );

    return {
      success: true,
      message: 'Profil berhasil diperbarui.',
      data: updated,
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async loginMaba(
    @Body() body: Record<string, string>,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { email, password } = body;
    if (!email || !password) {
      throw new ForbiddenException('Email dan password harus diisi.');
    }

    const user = await this.authService.validateMabaLogin(email, password);
    const tokens = await this.authService.generateTokensWithPermissions(user);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true,
      sameSite: isProduction ? 'lax' : 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,
      sameSite: isProduction ? 'lax' : 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        user: {
          id: user._id,
          name: user.name,
          nim: user.nim,
          role: user.role,
        },
      },
      message: 'Login berhasil',
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(
    @Req() req: Request,
    @Body('refreshToken') bodyToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken =
      (req.cookies &&
        (req.cookies as Record<string, string>)['refreshToken']) ||
      bodyToken;
    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token is missing');
    }
    const tokens = await this.authService.refreshTokens(refreshToken);

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    // Set httpOnly cookies for the new tokens
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true, // Always true - required by browsers for sameSite: 'none'
      sameSite: isProduction ? 'lax' : 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true, // Always true - required by browsers for sameSite: 'none'
      sameSite: isProduction ? 'lax' : 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  @Post('switch-role')
  @UseGuards(JwtAuthGuard)
  async switchRole(
    @CurrentUser() user: AuthenticatedRequest['user'],
    @Body('assignmentId') assignmentId: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const tokens = await this.authService.switchRole(user.userId.toString());

    const isProduction =
      this.configService.get<string>('NODE_ENV') === 'production';

    // Set new tokens in httpOnly cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true, // Always true - required by browsers for sameSite: 'none'
      sameSite: isProduction ? 'lax' : 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true, // Always true - required by browsers for sameSite: 'none'
      sameSite: isProduction ? 'lax' : 'none',
      maxAge: 30 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      message: 'Role switched successfully',
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout(@Res({ passthrough: true }) res: Response) {
    // Clear authentication cookies
    res.clearCookie('accessToken', { path: '/' });
    res.clearCookie('refreshToken', { path: '/' });

    return { success: true, data: null, message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: AuthenticatedRequest['user']) {
    const profile = await this.authService.getProfile(user.userId.toString());
    if (!profile) return { success: true, data: null };

    const rawObj = (profile.toObject
      ? profile.toObject()
      : profile) as unknown as Record<string, unknown>;
    const roleObj = rawObj.role as
      | {
          name?: string;
          slug?: string;
          permissions?: Array<string | { name?: string }>;
        }
      | undefined;
    let permissions: string[] = user.permissions || [];

    if (
      roleObj &&
      typeof roleObj === 'object' &&
      Array.isArray(roleObj.permissions)
    ) {
      permissions = roleObj.permissions.map((p) =>
        typeof p === 'string' ? p : p.name || '',
      );
    }

    if (roleObj?.slug === 'super_admin' || roleObj?.name === 'Super Admin') {
      permissions = ['manage:all', ...permissions];
    }

    let verificationToken = '';
    if (rawObj.nim) {
      try {
        const algorithm = 'aes-256-cbc';
        const secretKey = crypto.scryptSync(
          this.configService.get<string>('JWT_SECRET') || 'pkkmb_super_secret',
          'salt',
          32,
        );
        const iv = crypto.randomBytes(16);
        const cipher = crypto.createCipheriv(algorithm, secretKey, iv);
        let encrypted = cipher.update(rawObj.nim as string, 'utf8', 'hex');
        encrypted += cipher.final('hex');
        verificationToken = `${iv.toString('hex')}-${encrypted}`;
      } catch (err) {
        this.logger.error(
          'Failed to generate verification token',
          (err as Error).message,
        );
      }
    }

    console.log(
      'Generated verificationToken:',
      verificationToken,
      'for NIM:',
      rawObj.nim,
    );

    return {
      success: true,
      data: {
        ...rawObj,
        permissions,
        verificationToken,
      },
    };
  }

  @Get('verify-token/:token')
  async verifyMabaToken(@Param('token') token: string) {
    try {
      const [ivHex, encryptedHex] = token.split('-');
      if (!ivHex || !encryptedHex)
        throw new BadRequestException('Token tidak valid');

      const algorithm = 'aes-256-cbc';
      const secretKey = crypto.scryptSync(
        this.configService.get<string>('JWT_SECRET') || 'pkkmb_super_secret',
        'salt',
        32,
      );
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipheriv(algorithm, secretKey, iv);
      let nim = decipher.update(encryptedHex, 'hex', 'utf8');
      nim += decipher.final('utf8');

      const user = await this.authService.validateUserByNim(nim);
      if (!user)
        throw new BadRequestException('Data mahasiswa tidak ditemukan');

      return {
        success: true,
        data: {
          name: user.name,
          nim: user.nim,
          department:
            (typeof user.department === 'object' &&
            user.department &&
            'name' in user.department
              ? (user.department as { name?: string }).name
              : undefined) ||
            user.department ||
            (user as unknown as { studyProgram?: string }).studyProgram ||
            '-',
          pkkmbGroup: user.pkkmbGroup,
          avatar: user.avatar,
        },
      };
    } catch {
      throw new BadRequestException(
        'Token verifikasi tidak valid atau kedaluwarsa',
      );
    }
  }
}
