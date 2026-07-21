import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../../schemas/user.schema';
import { Types } from 'mongoose';
import { AppPermission } from '../../common/auth/permissions';
import { RoleDocument } from '../../schemas/role.schema';
import { Request } from 'express';

interface JwtPayload {
  sub: string;
  email: string;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    configService: ConfigService,
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
  ) {
    const secret = configService.get<string>('JWT_SECRET');
    if (!secret) throw new Error('JWT_SECRET is not defined. Aborting startup.');

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        // Custom extractor: check cookie first, then Authorization header
        (request: Request) => {
          let token: string | null = null;
          if (request && request.cookies) {
            token = request.cookies['accessToken'];
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

  async validate(payload: JwtPayload) {
    const user = await this.userModel
      .findById(payload.sub)
      .populate<{ role: RoleDocument & { permissions: { name: string }[] } }>({
        path: 'role',
        populate: { path: 'permissions' },
      })
      .exec();

    if (!user || !user.isActive) {
      throw new UnauthorizedException('User not found or inactive');
    }

    console.log('=== JWT STRATEGY DEBUG ===');
    console.log('User email:', user.email);
    console.log('User.role (raw):', user.role);
    
    // user.populated('role') returns undefined even though role IS populated
    // So we use user.role directly and check if it's an object (populated) vs ObjectId (not populated)
    const role = (user.role && typeof user.role === 'object' && '_id' in user.role)
      ? user.role as (Omit<RoleDocument, 'permissions'> & { permissions: { name: string }[] })
      : undefined;
    
    console.log('Role after extraction:', role);
    console.log('Role slug:', role?.slug);
    console.log('=========================');
    
    const permissions = role?.permissions?.map((p) => p.name as AppPermission) || [];

    return {
      userId: user._id.toString(),
      activeRoleId: role?._id?.toString() || user.role?.toString(),
      role: role ? {
        _id: role._id,
        slug: role.slug,
        name: role.name,
        scope: role.scope,
      } : undefined,
      organizationId: user.department?.toString(),
      cabinetPeriod: user.cabinetPeriod,
      permissions,
      session: null,
    };
  }
}
