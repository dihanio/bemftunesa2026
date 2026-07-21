import { Module, Global } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailListener } from './mail.listener';
import { MailerModule } from '@nestjs-modules/mailer';
// @ts-ignore
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
          host: configService.get<string>('SMTP_HOST'),
          port: configService.get<number>('SMTP_PORT'),
          secure: false, // use false for Ethereal/STARTTLS
          auth: {
            user: configService.get<string>('SMTP_USER'),
            pass: configService.get<string>('SMTP_PASS'),
          },
        },
        defaults: {
          from: `"${configService.get<string>('SMTP_FROM_NAME')}" <${configService.get<string>('SMTP_FROM_EMAIL')}>`,
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
  providers: [MailService, MailListener],
  exports: [MailService],
})
export class MailModule {}
