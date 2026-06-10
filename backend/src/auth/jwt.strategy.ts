import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument } from '../database/schema/users';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(
    private configService: ConfigService,
    @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET', 'default-secret'),
    });
  }

  async validate(payload: any) {
    if (!payload.sub || !payload.email) {
      throw new UnauthorizedException('Token tidak valid');
    }

    // Dynamically fetch the latest user role and state from the database
    const dbUser = await this.userModel
      .findById(payload.sub)
      .select('role departmentId isActive')
      .lean();

    if (dbUser && !dbUser.isActive) {
      throw new UnauthorizedException('Akun Anda telah dinonaktifkan.');
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: dbUser ? dbUser.role : payload.role,
      roles: dbUser?.role
        ? [dbUser.role]
        : payload.roles || [payload.role].filter(Boolean),
      department: dbUser ? dbUser.departmentId : payload.department,
    };
  }
}
