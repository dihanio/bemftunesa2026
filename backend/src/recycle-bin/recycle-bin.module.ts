import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecycleBinController } from './recycle-bin.controller';
import { RecycleBinService } from './recycle-bin.service';
import { UserSchema } from '../schemas/user.schema';
import { DepartmentSchema } from '../schemas/department.schema';
import { ProgramSchema } from '../schemas/program.schema';
import { TaskSchema } from '../schemas/task.schema';
import { DocumentSchema } from '../schemas/document.schema';
import { MeetingSchema } from '../schemas/meeting.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Department', schema: DepartmentSchema },
      { name: 'Program', schema: ProgramSchema },
      { name: 'Task', schema: TaskSchema },
      { name: 'Document', schema: DocumentSchema },
      { name: 'Meeting', schema: MeetingSchema },
    ]),
  ],
  controllers: [RecycleBinController],
  providers: [RecycleBinService],
})
export class RecycleBinModule {}
