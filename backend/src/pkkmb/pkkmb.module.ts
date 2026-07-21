import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthModule } from '../auth/auth.module';

import { User, UserSchema } from '../schemas/user.schema';
import { PkkmbGroup, PkkmbGroupSchema } from '../schemas/pkkmb-group.schema';
import {
  PkkmbAttendanceSession,
  PkkmbAttendanceSessionSchema,
  PkkmbAttendanceLog,
  PkkmbAttendanceLogSchema,
} from '../schemas/pkkmb-attendance.schema';
import {
  PkkmbTask,
  PkkmbTaskSchema,
  PkkmbSubmission,
  PkkmbSubmissionSchema,
} from '../schemas/pkkmb-task.schema';
import { PkkmbSchedule, PkkmbScheduleSchema } from '../schemas/pkkmb-schedule.schema';
import { PkkmbAnnouncement, PkkmbAnnouncementSchema } from '../schemas/pkkmb-announcement.schema';
import { PkkmbPointLog, PkkmbPointLogSchema } from '../schemas/pkkmb-point-log.schema';
import { PkkmbGallery, PkkmbGallerySchema } from '../schemas/pkkmb-gallery.schema';

import { PkkmbController } from './pkkmb.controller';
import { PkkmbService } from './pkkmb.service';

@Module({
  imports: [
    AuthModule,
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: PkkmbGroup.name, schema: PkkmbGroupSchema },
      { name: PkkmbAttendanceSession.name, schema: PkkmbAttendanceSessionSchema },
      { name: PkkmbAttendanceLog.name, schema: PkkmbAttendanceLogSchema },
      { name: PkkmbTask.name, schema: PkkmbTaskSchema },
      { name: PkkmbSubmission.name, schema: PkkmbSubmissionSchema },
      { name: PkkmbSchedule.name, schema: PkkmbScheduleSchema },
      { name: PkkmbAnnouncement.name, schema: PkkmbAnnouncementSchema },
      { name: PkkmbPointLog.name, schema: PkkmbPointLogSchema },
      { name: PkkmbGallery.name, schema: PkkmbGallerySchema },
    ]),
  ],
  controllers: [PkkmbController],
  providers: [PkkmbService],
  exports: [PkkmbService],
})
export class PkkmbModule {}
