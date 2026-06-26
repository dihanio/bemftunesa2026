import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { RecruitmentService } from './recruitment.service';
import { RecruitmentController } from './recruitment.controller';
import { Recruitment, RecruitmentSchema } from '../schemas/recruitment.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Recruitment.name, schema: RecruitmentSchema }]),
  ],
  controllers: [RecruitmentController],
  providers: [RecruitmentService],
  exports: [RecruitmentService],
})
export class RecruitmentModule {}
