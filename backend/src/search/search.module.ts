import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SearchController } from './search.controller';
import { SearchService } from './search.service';
import { UserSchema } from '../schemas/user.schema';
import { DepartmentSchema } from '../schemas/department.schema';
import { ProgramSchema } from '../schemas/program.schema';
import { TaskSchema } from '../schemas/task.schema';
import { DocumentSchema } from '../schemas/document.schema';
import { MeetingSchema } from '../schemas/meeting.schema';
import { AspirationSchema } from '../schemas/aspiration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'User', schema: UserSchema },
      { name: 'Department', schema: DepartmentSchema },
      { name: 'Program', schema: ProgramSchema },
      { name: 'Task', schema: TaskSchema },
      { name: 'Document', schema: DocumentSchema },
      { name: 'Meeting', schema: MeetingSchema },
      { name: 'Aspiration', schema: AspirationSchema },
    ]),
  ],
  controllers: [SearchController],
  providers: [SearchService],
})
export class SearchModule {}
