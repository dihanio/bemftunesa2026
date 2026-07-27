import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
  roleId?: string;
  roleSlug?: string;
  permissions?: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret)
      throw new Error('JWT_SECRET is not defined. Aborting startup.');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Custom extractor: check cookie first, then Authorization header
        (request: Request) => {
          let token: string | null = null;
          if (request && request.cookies) {
            token = (request.cookies as Record<string, string>)['accessToken'];
          }
          // Fallback to Authorization header for backward compatibility
          if (!token) {
            const authHeader = request?.headers?.authorization;
            if (authHeader && authHeader.startsWith('Bearer ')) {
              token = authHeader.substring(7);
            }
          }
          return token;
        },
      ]),
      ignoreExpiration: false,
      secretOrKey: secret,
      passReqToCallback: false,
    });
  }

  validate(payload: JwtPayload) {
    return {
      userId: payload.sub,
      activeRoleId: payload.roleId,
      role: payload.roleSlug
        ? {
            _id: payload.roleId,
            slug: payload.roleSlug,
            name: payload.roleSlug,
          }
        : undefined,
      permissions: payload.permissions || [],
      session: null,
    };
  }
}
