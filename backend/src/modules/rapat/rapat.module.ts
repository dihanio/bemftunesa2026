import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Meeting, MeetingSchema } from '../../schemas/meeting.schema';
import { Attendance, AttendanceSchema } from '../../schemas/attendance.schema';
import { User, UserSchema } from '../../schemas/user.schema';
import { RapatService } from './rapat.service';
import { RapatController } from './rapat.controller';
import { RapatGateway } from './rapat.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Meeting.name, schema: MeetingSchema },
      { name: Attendance.name, schema: AttendanceSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [RapatController],
  providers: [RapatService, RapatGateway],
  exports: [RapatService, RapatGateway],
})
export class RapatModule {}
