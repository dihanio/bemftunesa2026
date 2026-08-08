import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';
import { AuthModule } from '../auth/auth.module';

import { User, UserSchema } from '../schemas/user.schema';
import { Role, RoleSchema } from '../schemas/role.schema';
import { PkkmbGroup, PkkmbGroupSchema } from '../schemas/pkkmb-group.schema';
import {
  PkkmbAttendanceSession,
  PkkmbAttendanceSessionSchema,
  PkkmbAttendanceRecord,
  PkkmbAttendanceRecordSchema,
} from '../schemas/pkkmb-attendance.schema';
import {
  PkkmbTask,
  PkkmbTaskSchema,
  PkkmbSubmission,
  PkkmbSubmissionSchema,
} from '../schemas/pkkmb-task.schema';
import {
  PkkmbSchedule,
  PkkmbScheduleSchema,
} from '../schemas/pkkmb-schedule.schema';
import {
  PkkmbAnnouncement,
  PkkmbAnnouncementSchema,
} from '../schemas/pkkmb-announcement.schema';
import {
  PkkmbPointLog,
  PkkmbPointLogSchema,
} from '../schemas/pkkmb-point-log.schema';
import {
  PkkmbGallery,
  PkkmbGallerySchema,
} from '../schemas/pkkmb-gallery.schema';

import { Rumpun, RumpunSchema } from '../schemas/rumpun.schema';
import {
  StudyProgram,
  StudyProgramSchema,
} from '../schemas/study-program.schema';
import {
  PkkmbPublishConfig,
  PkkmbPublishConfigSchema,
} from '../schemas/pkkmb-publish-config.schema';

import { PkkmbController } from './pkkmb.controller';
import { PkkmbService } from './pkkmb.service';
import { KtmsOcrController } from './ktms-ocr.controller';
import { KtmsOcrService } from './ktms-ocr.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: Role.name, schema: RoleSchema },
      { name: PkkmbGroup.name, schema: PkkmbGroupSchema },
      {
        name: PkkmbAttendanceSession.name,
        schema: PkkmbAttendanceSessionSchema,
      },
      { name: PkkmbAttendanceRecord.name, schema: PkkmbAttendanceRecordSchema },
      { name: PkkmbTask.name, schema: PkkmbTaskSchema },
      { name: PkkmbSubmission.name, schema: PkkmbSubmissionSchema },
      { name: PkkmbSchedule.name, schema: PkkmbScheduleSchema },
      { name: PkkmbAnnouncement.name, schema: PkkmbAnnouncementSchema },
      { name: PkkmbPointLog.name, schema: PkkmbPointLogSchema },
      { name: PkkmbGallery.name, schema: PkkmbGallerySchema },
      { name: Rumpun.name, schema: RumpunSchema },
      { name: StudyProgram.name, schema: StudyProgramSchema },
      { name: PkkmbPublishConfig.name, schema: PkkmbPublishConfigSchema },
    ]),
  ],
  controllers: [PkkmbController, KtmsOcrController],
  providers: [
    PkkmbService,
    KtmsOcrService,
    {
      provide: 'REDIS_CLIENT',
      useFactory: (configService: ConfigService) => {
        const host = configService.get<string>('REDIS_HOST', 'localhost');
        const port = configService.get<number>('REDIS_PORT', 6379);
        return new Redis({
          host,
          port,
          maxRetriesPerRequest: 3,
          retryStrategy(times: number) {
            if (times > 3) return null;
            return Math.min(times * 200, 2000);
          },
          lazyConnect: false,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [PkkmbService],
})
export class PkkmbModule {}
