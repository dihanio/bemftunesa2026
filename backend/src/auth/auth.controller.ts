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
import { Throttle } from '@nestjs/throttler';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { AuthenticatedRequest } from '../common/interfaces/authenticated-request.interface';
import { ConfigService } from '@nestjs/config';
import { GoogleOauthGuard } from './guards/google-oauth.guard';

export interface GoogleProfile {
  googleId: string;
  email: string;
  name: string;
  avatar?: string;
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private configService: ConfigService,
  ) {}

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('google')
  @UseGuards(GoogleOauthGuard)
  googleLogin() {
    // Initiates Google OAuth flow
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Get('google/callback')
  @UseGuards(GoogleOauthGuard)
  async googleCallback(@Req() req: Request & { user?: GoogleProfile }, @Res() res: Response) {
    const profile = req.user!;
    const imsUrl = this.configService.get<string>('IMS_URL');

    console.log('🔐 [AUTH] Google callback received for:', profile.email);

    try {
      const user = await this.authService.validateGoogleUser(profile);
      console.log('✅ [AUTH] User validated successfully:', user.email, '| Position:', user.position);
      
      const tokens = await this.authService.generateTokens(user);

      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      
      // Set httpOnly cookies for security (prevent XSS)
      // Use 'none' in development for cross-origin requests (localhost:3001 → localhost:4000)
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: true,  // Always true - required by browsers for sameSite: 'none'
        sameSite: isProduction ? 'lax' : 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/',
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,  // Always true - required by browsers for sameSite: 'none'
        sameSite: isProduction ? 'lax' : 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
        path: '/',
      });

      const state = req.query.state as string;
      const baseUrl = state === 'pkkmb' ? this.configService.get<string>('PKKMB_URL') : this.configService.get<string>('IMS_URL');
      const successUrl = `${baseUrl}/login?authenticated=true`;
      console.log('🍪 [AUTH] Cookies set successfully');
      console.log('🔄 [AUTH] Redirecting to:', successUrl);
      
      res.redirect(successUrl);
      console.log('✓ [AUTH] Redirect response sent successfully');
      return;
    } catch (error: any) {
      console.log('❌ [AUTH] Validation error:', error.message);
      
      const state = req.query.state as string;
      const baseUrl = state === 'pkkmb' ? this.configService.get<string>('PKKMB_URL') : this.configService.get<string>('IMS_URL');
      
      // Handle specific authentication errors by redirecting
      if (error.message === 'PENDING_APPROVAL') {
        const pendingUrl = `${baseUrl}/pending`;
        console.log('⏳ [AUTH] User pending approval, redirecting DIRECTLY to:', pendingUrl);
        res.redirect(pendingUrl);
        console.log('✓ [AUTH] Direct redirect to /pending sent');
        return;
      } else if (error.message === 'DEACTIVATED_ACCOUNT') {
        const deactivatedUrl = `${baseUrl}/login?error=deactivated`;
        console.log('🚫 [AUTH] User deactivated, redirecting to:', deactivatedUrl);
        
        res.redirect(deactivatedUrl);
        console.log('✓ [AUTH] Redirect to login (deactivated) sent');
        return;
      } else {
        const failedUrl = `${baseUrl}/login?error=auth_failed`;
        console.log('⚠️ [AUTH] Auth failed, redirecting to:', failedUrl);
        
        res.redirect(failedUrl);
        console.log('✓ [AUTH] Redirect to login (auth_failed) sent');
        return;
      }
    }
  }

  @Throttle({ default: { limit: 3, ttl: 60000 } })
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

      const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
      
      // Set httpOnly cookies for security
      res.cookie('accessToken', tokens.accessToken, {
        httpOnly: true,
        secure: true,  // Always true - required by browsers for sameSite: 'none'
        sameSite: isProduction ? 'lax' : 'none',
        maxAge: 7 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      res.cookie('refreshToken', tokens.refreshToken, {
        httpOnly: true,
        secure: true,  // Always true - required by browsers for sameSite: 'none'
        sameSite: isProduction ? 'lax' : 'none',
        maxAge: 30 * 24 * 60 * 60 * 1000,
        path: '/',
      });

      const imsUrl = this.configService.get<string>('IMS_URL');
      res.redirect(`${imsUrl}/login?authenticated=true`);
    } catch (error: any) {
      res.status(401).json({ success: false, message: error.message });
    }
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('login')
  async loginMaba(@Body() body: any, @Res({ passthrough: true }) res: Response) {
    const { nim, password } = body;
    if (!nim || !password) {
      throw new ForbiddenException('NIM dan password harus diisi.');
    }

    const user = await this.authService.validateMabaLogin(nim, password);
    const tokens = await this.authService.generateTokens(user);

    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
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
        }
      },
      message: 'Login berhasil'
    };
  }

  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @Post('refresh')
  async refresh(@Body('refreshToken') refreshToken: string, @Res({ passthrough: true }) res: Response) {
    const tokens = await this.authService.refreshTokens(refreshToken);
    
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    // Set httpOnly cookies for the new tokens
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true,  // Always true - required by browsers for sameSite: 'none'
      sameSite: isProduction ? 'lax' : 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,  // Always true - required by browsers for sameSite: 'none'
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
    const tokens = await this.authService.switchRole(user.userId.toString(), assignmentId);
    
    const isProduction = this.configService.get<string>('NODE_ENV') === 'production';
    
    // Set new tokens in httpOnly cookies
    res.cookie('accessToken', tokens.accessToken, {
      httpOnly: true,
      secure: true,  // Always true - required by browsers for sameSite: 'none'
      sameSite: isProduction ? 'lax' : 'none',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    res.cookie('refreshToken', tokens.refreshToken, {
      httpOnly: true,
      secure: true,  // Always true - required by browsers for sameSite: 'none'
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
    return { success: true, data: profile };
  }
}
