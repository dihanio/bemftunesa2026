import {
  Controller,
  Get,
  Post,
  Body,
  UseGuards,
  Req,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/user.schema';
import { ConfigService } from '@nestjs/config';
import { GoogleOauthGuard } from './guards/google-oauth.guard';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Get('google')
  @UseGuards(GoogleOauthGuard)
  googleLogin() {
    // Initiates Google OAuth flow
  }

  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleCallback(@Req() req: Request, @Res() res: Response) {
    const profile = req.user as {
      googleId: string;
      email: string;
      name: string;
      avatar?: string;
    };

    const user = await this.authService.validateGoogleUser(profile);
    const tokens = await this.authService.generateTokens(user);

    const imsUrl = this.configService.get<string>('IMS_URL');
    res.redirect(
      `${imsUrl}/login?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
    );
  }

  @Get('bypass')
  async bypassLogin(@Req() req: Request, @Res() res: Response) {
    if (this.configService.get<string>('NODE_ENV') === 'production') {
      throw new ForbiddenException('Bypass login is disabled in production');
    }
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ success: false, message: 'Email query parameter is required for bypass login' });
    }

    try {
      const user = await this.authService.validateBypassUser(email);
      const tokens = await this.authService.generateTokens(user);

      const imsUrl = this.configService.get<string>('IMS_URL');
      res.redirect(
        `${imsUrl}/login?token=${tokens.accessToken}&refreshToken=${tokens.refreshToken}`,
      );
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string) {
    const tokens = await this.authService.refreshTokens(refreshToken);
    return {
      success: true,
      data: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
    };
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  logout() {
    return { success: true, data: null, message: 'Logged out successfully' };
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: UserDocument) {
    const profile = await this.authService.getProfile((user._id as unknown as string).toString());
    return { success: true, data: profile };
  }
}
