import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { GoogleStrategy } from './strategies/google.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';
import { User, UserSchema } from '../schemas/user.schema';
import { Role, RoleSchema } from '../schemas/role.schema';
import { Permission, PermissionSchema } from '../schemas/permission.schema';

import { AuthorizationService } from '../common/auth/authorization.service';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const expiresInConfig = configService.get<string>('JWT_EXPIRES_IN', '604800');
        const expiresIn = /^\\d+$/.test(expiresInConfig) ? parseInt(expiresInConfig, 10) : expiresInConfig;
        
        return {
          secret: configService.get<string>('JWT_SECRET'),
          signOptions: {
            expiresIn,
          },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: Permission.name, schema: PermissionSchema },
    ]),
  ],
  controllers: [AuthController],
  providers: [AuthService, GoogleStrategy, JwtStrategy, AuthorizationService],
  exports: [AuthService, JwtModule, AuthorizationService],
})
export class AuthModule {}
