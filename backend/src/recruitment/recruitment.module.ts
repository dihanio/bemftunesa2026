import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Recruitment, RecruitmentSchema } from '../schemas/recruitment.schema';
import { RecruitmentController } from './recruitment.controller';
import { RecruitmentService } from './recruitment.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Recruitment.name, schema: RecruitmentSchema },
    ]),
  ],
  controllers: [RecruitmentController],
  providers: [RecruitmentService],
})
export class RecruitmentModule {}
