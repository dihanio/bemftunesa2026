import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { APP_GUARD } from '@nestjs/core';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { RolesModule } from './roles/roles.module';
import { PermissionsModule } from './permissions/permissions.module';
import { ContentModule } from './content/content.module';
import { EventsModule } from './events/events.module';
import { DepartmentsModule } from './departments/departments.module';
import { MediaModule } from './media/media.module';
import { MenusModule } from './menus/menus.module';
import { SettingsModule } from './settings/settings.module';
import { AuditModule } from './audit/audit.module';
import { PartnersModule } from './partners/partners.module';
import { StructureModule } from './structure/structure.module';
import { RecruitmentModule } from './recruitment/recruitment.module';
import { GalleryModule } from './gallery/gallery.module';
import { PublicModule } from './public/public.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { CabinetPeriodModule } from './cabinet-period/cabinet-period.module';
import { ProgramsModule } from './programs/programs.module';
import { TasksModule } from './tasks/tasks.module';
import { MeetingsModule } from './meetings/meetings.module';
import { AspirationsModule } from './aspirations/aspirations.module';
import { DocumentsModule } from './documents/documents.module';
import { SearchModule } from './search/search.module';
import { RecycleBinModule } from './recycle-bin/recycle-bin.module';
import { NotificationsModule } from './notifications/notifications.module';
import { SuratModule } from './modules/surat/surat.module';
import { RapatModule } from './modules/rapat/rapat.module';
import { TemplateEngineModule } from './modules/document-platform/template-engine/template-engine.module';
import { TemplateManagementModule } from './modules/document-platform/template-management/template-management.module';
import { WorkflowEngineModule } from './modules/document-platform/workflow-engine/workflow-engine.module';
import { WorkflowManagementModule } from './modules/document-platform/workflow-management/workflow-management.module';
import { NumberingEngineModule } from './modules/document-platform/numbering-engine/numbering-engine.module';
import { NumberingManagementModule } from './modules/document-platform/numbering-management/numbering-management.module';
import { AiEngineModule } from './modules/document-platform/ai-engine/ai-engine.module';
import { ExportEngineModule } from './modules/document-platform/export-engine/export-engine.module';
import { NotificationEngineModule } from './modules/document-platform/notification-engine/notification-engine.module';

@Module({
  imports: [
    // Config
    ConfigModule.forRoot({ isGlobal: true, envFilePath: '.env' }),

    // Database
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI') as string,
      }),
    }),

    // Rate limiting
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),

    // Event emitter for Audit system
    EventEmitterModule.forRoot(),

    // Feature modules
    AuthModule,
    UsersModule,
    RolesModule,
    PermissionsModule,
    ContentModule,
    EventsModule,
    DepartmentsModule,
    MediaModule,
    MenusModule,
    SettingsModule,
    AuditModule,
    PartnersModule,
    StructureModule,
    RecruitmentModule,
    GalleryModule,
    PublicModule,
    DashboardModule,
    CabinetPeriodModule,
    ProgramsModule,
    TasksModule,
    MeetingsModule,
    AspirationsModule,
    DocumentsModule,
    SearchModule,
    RecycleBinModule,
    NotificationsModule,
    SuratModule,
    RapatModule,
    TemplateEngineModule,
    TemplateManagementModule,
    WorkflowEngineModule,
    WorkflowManagementModule,
    NumberingEngineModule,
    NumberingManagementModule,
    AiEngineModule,
    ExportEngineModule,
    NotificationEngineModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
