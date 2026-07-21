import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Applicant, ApplicantSchema } from '../schemas/applicant.schema';
import { Recruitment, RecruitmentSchema } from '../schemas/recruitment.schema';
import { ApplicantController } from './applicant.controller';
import { ApplicantService } from './applicant.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Applicant.name, schema: ApplicantSchema },
      { name: Recruitment.name, schema: RecruitmentSchema }
    ]),
  ],
  controllers: [ApplicantController],
  providers: [ApplicantService],
  exports: [ApplicantService]
})
export class ApplicantModule {}
