import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { BullModule } from '@nestjs/bullmq';
import * as Joi from 'joi';

import { AuthModule } from './auth/auth.module';
import { PublicModule } from './public/public.module';
import { OrganizationModule } from './organization/organization.module';
import { AspirationsModule } from './aspirations/aspirations.module';
import { ContentModule } from './content/content.module';
import { ProgramsModule } from './programs/programs.module';
import { PartnersModule } from './partners/partners.module';
import { AuditModule } from './audit/audit.module';
import { GalleryModule } from './gallery/gallery.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { ApplicantModule } from './applicant/applicant.module';
import { SettingsModule } from './settings/settings.module';
import { MailModule } from './mail/mail.module';
import { HealthModule } from './health/health.module';
import { PkkmbModule } from './pkkmb/pkkmb.module';
import { LettersModule } from './letters/letters.module';
import { CommitteesModule } from './committees/committees.module';
import { OrganizationsModule } from './organizations/organizations.module';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { NestModule, MiddlewareConsumer } from '@nestjs/common';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validationSchema: Joi.object({
        PORT: Joi.number().default(4000),
        MONGODB_URI: Joi.string().required(),
        JWT_SECRET: Joi.string().required(),
        REDIS_HOST: Joi.string().default('localhost'),
        REDIS_PORT: Joi.number().default(6379),
        // Add placeholders for Future readiness of Storage as requested
        STORAGE_URL: Joi.string().optional(),
        STORAGE_KEY: Joi.string().optional(),
      }),
    }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
      }),
      inject: [ConfigService],
    }),

    // Background Jobs (BullMQ)
    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        connection: {
          host: configService.get<string>('REDIS_HOST', 'localhost'),
          port: configService.get<number>('REDIS_PORT', 6379),
        },
      }),
      inject: [ConfigService],
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 300 }]),

    // Events
    EventEmitterModule.forRoot(),

    // Feature modules
    MailModule,
    AuthModule,
    PublicModule,
    OrganizationModule,
    AspirationsModule,
    ContentModule,
    ProgramsModule,
    PartnersModule,
    AuditModule,
    GalleryModule,
    RecruitmentModule,
    ApplicantModule,
    SettingsModule,
    HealthModule,
    PkkmbModule,
    LettersModule,
    CommitteesModule,
    OrganizationsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware, LoggingMiddleware)
      .forRoutes('*');
  }
}
