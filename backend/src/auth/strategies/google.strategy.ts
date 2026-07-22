import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, VerifyCallback } from 'passport-google-oauth20';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(configService: ConfigService) {
    super({
      clientID: configService.get<string>('GOOGLE_CLIENT_ID', ''),
      clientSecret: configService.get<string>('GOOGLE_CLIENT_SECRET', ''),
      callbackURL: configService.get<string>('GOOGLE_CALLBACK_URL', ''),
      scope: ['email', 'profile'],
    });
  }

  validate(
    _accessToken: string,
    _refreshToken: string,
    profile: {
      emails: { value: string }[];
      displayName: string;
      photos?: { value: string }[];
      id: string;
    },
    done: VerifyCallback,
  ) {
    const { emails, displayName, photos, id } = profile;
    const user = {
      googleId: id,
      email: emails[0].value,
      name: displayName,
      avatar: photos?.[0]?.value,
    };
    done(null, user as unknown as Express.User);
  }
}
