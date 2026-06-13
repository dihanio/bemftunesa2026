import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtStrategy } from './jwt.strategy';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { User, UserSchema } from '../database/schema/users';
import { PermissionsModule } from '../permissions/permissions.module';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => {
        let secret = configService.get<string>('JWT_SECRET');
        const isProd = configService.get<string>('NODE_ENV') === 'production';
        
        if (isProd && (!secret || secret === 'default-secret')) {
          console.warn('⚠️ WARNING: JWT_SECRET is missing in production .env!');
          console.warn('⚠️ Auto-generating a secure temporary secret...');
          console.warn('⚠️ Note: All users will be forcibly logged out every time the server restarts until you set a permanent JWT_SECRET.');
          secret = require('crypto').randomBytes(32).toString('hex');
        }

        return {
          secret: secret || 'default-secret',
          signOptions: {
            expiresIn: configService.get<string>('JWT_EXPIRES_IN', '7d') as any,
          },
        };
      },
      inject: [ConfigService],
    }),
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    PermissionsModule,
  ],
  controllers: [AuthController],
  providers: [JwtStrategy, AuthService],
  exports: [JwtModule, PassportModule, AuthService],
})
export class AuthModule {}
