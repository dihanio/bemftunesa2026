import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailListener } from './mail.listener';
import { PostalSmtpAdapter } from './providers/postal-smtp.adapter';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { MailLog, MailLogSchema } from '../schemas/mail-log.schema';
import { join } from 'path';

@Global()
@Module({
  imports: [
    MongooseModule.forFeature([{ name: MailLog.name, schema: MailLogSchema }]),
    MailerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        transport: {
          host: configService.get<string>('SMTP_HOST', 'postal'),
          port: Number(configService.get('SMTP_PORT')) || 25,
          secure: Number(configService.get('SMTP_PORT')) === 465,
          auth: configService.get<string>('SMTP_USER')
            ? {
                user: configService.get<string>('SMTP_USER'),
                pass: configService.get<string>('SMTP_PASS'),
              }
            : undefined,
          tls: {
            rejectUnauthorized: false,
          },
        },
        defaults: {
          from: `"${configService.get<string>('SMTP_FROM_NAME', 'BEM FT UNESA 2026')}" <${configService.get<string>('SMTP_FROM_EMAIL', 'noreply@bemftunesa.org')}>`,
        },
        template: {
          dir: join(__dirname, 'templates'),
          adapter: new HandlebarsAdapter(),
          options: {
            strict: true,
          },
        },
      }),
    }),
  ],
  providers: [MailService, MailListener, PostalSmtpAdapter],
  exports: [MailService, PostalSmtpAdapter],
})
export class MailModule {}
