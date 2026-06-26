import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DashboardController } from './dashboard.controller';
import { DashboardService } from './dashboard.service';
import { DepartmentSchema } from '../schemas/department.schema';
import { UserSchema } from '../schemas/user.schema';
import { ProgramSchema } from '../schemas/program.schema';
import { TaskSchema } from '../schemas/task.schema';
import { AspirationSchema } from '../schemas/aspiration.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: 'Department', schema: DepartmentSchema },
      { name: 'User', schema: UserSchema },
      { name: 'Program', schema: ProgramSchema },
      { name: 'Task', schema: TaskSchema },
      { name: 'Aspiration', schema: AspirationSchema },
    ]),
  ],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
