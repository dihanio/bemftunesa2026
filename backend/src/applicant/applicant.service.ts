import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Applicant, ApplicantDocument, ApplicantStatus } from '../schemas/applicant.schema';
import { Recruitment, RecruitmentDocument } from '../schemas/recruitment.schema';
import { 
  RegisterApplicantDto, 
  UpdateApplicantStatusDto, 
  ScheduleInterviewDto, 
  SubmitInterviewResultDto, 
  SetFinalResultDto,
  ApplicantQueryDto
} from './dto/applicant.dto';

@Injectable()
export class ApplicantService {
  constructor(
    @InjectModel(Applicant.name) private applicantModel: Model<ApplicantDocument>,
    @InjectModel(Recruitment.name) private recruitmentModel: Model<RecruitmentDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  private async pushStatusHistory(
    id: string,
    status: ApplicantStatus,
    updatedBy?: string,
    notes?: string
  ) {
    const historyEntry: Record<string, unknown> = {
      status,
      updatedAt: new Date(),
    };
    if (updatedBy) historyEntry.updatedBy = new Types.ObjectId(updatedBy);
    if (notes) historyEntry.notes = notes;

    const updatedApplicant = await this.applicantModel.findByIdAndUpdate(id, {
      status,
      $push: { statusHistory: historyEntry }
    }, { new: true });

    if (updatedApplicant) {
      this.eventEmitter.emit('applicant.status.updated', {
        email: updatedApplicant.email,
        name: updatedApplicant.name,
        status: updatedApplicant.status,
      });
    }
  }

  async register(recruitmentId: string, dto: RegisterApplicantDto) {
    const recruitment = await this.recruitmentModel.findById(recruitmentId).exec();
    if (!recruitment) throw new NotFoundException('Rekrutmen tidak ditemukan');
    if (recruitment.status !== 'open') throw new BadRequestException('Pendaftaran rekrutmen ini sedang ditutup');
    if (!recruitment.useInternalForm) throw new BadRequestException('Rekrutmen ini menggunakan form eksternal');

    // Check duplicate NIM or Email
    const existingNim = await this.applicantModel.findOne({ recruitmentId: new Types.ObjectId(recruitmentId), nim: dto.nim }).exec();
    if (existingNim) throw new ConflictException(`NIM ${dto.nim} sudah terdaftar pada rekrutmen ini`);
    
    const existingEmail = await this.applicantModel.findOne({ recruitmentId: new Types.ObjectId(recruitmentId), email: dto.email }).exec();
    if (existingEmail) throw new ConflictException(`Email ${dto.email} sudah terdaftar pada rekrutmen ini`);

    const applicant = new this.applicantModel({
      ...dto,
      recruitmentId: new Types.ObjectId(recruitmentId),
      status: 'waiting_review',
      statusHistory: [{
        status: 'waiting_review',
        updatedAt: new Date(),
        notes: 'Mendaftar via form internal'
      }]
    });

    const savedApplicant = await applicant.save();

    this.eventEmitter.emit('applicant.created', {
      email: savedApplicant.email,
      name: savedApplicant.name,
    });

    return savedApplicant;
  }

  async findByRecruitment(recruitmentId: string, query: ApplicantQueryDto) {
    const { page = '1', limit = '20', q, status, positionChoice, department } = query;
    const pageNum = parseInt(page, 10);
    const limitNum = parseInt(limit, 10);
    
    const filter: Record<string, unknown> = { recruitmentId: new Types.ObjectId(recruitmentId) };
    if (status) filter.status = status;
    if (positionChoice) filter.positionChoice = positionChoice;
    if (department) filter.department = department;
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { nim: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }

    const skip = (pageNum - 1) * limitNum;
    const [data, total] = await Promise.all([
      this.applicantModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('statusHistory.updatedBy', 'name email')
        .exec(),
      this.applicantModel.countDocuments(filter),
    ]);

    return { data, total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) };
  }

  async findOne(id: string) {
    const applicant = await this.applicantModel.findById(id)
      .populate('statusHistory.updatedBy', 'name email')
      .populate('interview.interviewerId', 'name email')
      .exec();
    if (!applicant) throw new NotFoundException('Pendaftar tidak ditemukan');
    return applicant;
  }

  async updateStatus(id: string, dto: UpdateApplicantStatusDto, userId: string) {
    const applicant = await this.applicantModel.findById(id).exec();
    if (!applicant) throw new NotFoundException('Pendaftar tidak ditemukan');

    if (dto.notes) {
      await this.applicantModel.findByIdAndUpdate(id, { adminNotes: dto.notes });
    }

    await this.pushStatusHistory(id, dto.status, userId, dto.notes);
    return this.findOne(id);
  }

  async scheduleInterview(id: string, dto: ScheduleInterviewDto, userId: string) {
    const applicant = await this.applicantModel.findById(id).exec();
    if (!applicant) throw new NotFoundException('Pendaftar tidak ditemukan');

    const interviewData: Record<string, unknown> = {
      scheduledAt: new Date(dto.scheduledAt),
      location: dto.location,
    };
    
    if (dto.interviewerId) interviewData.interviewerId = new Types.ObjectId(dto.interviewerId);
    if (dto.interviewerName) interviewData.interviewerName = dto.interviewerName;

    await this.applicantModel.findByIdAndUpdate(id, { interview: interviewData });
    await this.pushStatusHistory(id, 'interview_scheduled', userId, `Interview scheduled at ${dto.scheduledAt} in ${dto.location}`);
    
    return this.findOne(id);
  }

  async submitInterviewResult(id: string, dto: SubmitInterviewResultDto, userId: string) {
    const applicant = await this.applicantModel.findById(id).exec();
    if (!applicant) throw new NotFoundException('Pendaftar tidak ditemukan');
    if (!applicant.interview) throw new BadRequestException('Wawancara belum dijadwalkan');

    const s = dto.scoring;
    // Computed final score if at least one score exists
    let finalScore = 0;
    let count = 0;
    
    if (s.communication !== undefined) { finalScore += s.communication; count++; }
    if (s.motivation !== undefined) { finalScore += s.motivation; count++; }
    if (s.teamwork !== undefined) { finalScore += s.teamwork; count++; }
    if (s.leadership !== undefined) { finalScore += s.leadership; count++; }
    if (s.technical !== undefined) { finalScore += s.technical; count++; }
    
    if (count > 0) {
      finalScore = Math.round((finalScore / count) * 100) / 100;
    }

    const updatedInterview = {
      ...applicant.interview,
      scoring: {
        ...s,
        finalScore: count > 0 ? finalScore : undefined
      },
      notes: dto.notes,
      completedAt: new Date()
    };

    await this.applicantModel.findByIdAndUpdate(id, { interview: updatedInterview });
    await this.pushStatusHistory(id, 'interviewed', userId, 'Interview result submitted');

    return this.findOne(id);
  }

  async setFinalResult(id: string, dto: SetFinalResultDto, userId: string) {
    const applicant = await this.applicantModel.findById(id).exec();
    if (!applicant) throw new NotFoundException('Pendaftar tidak ditemukan');

    await this.pushStatusHistory(id, dto.status, userId, dto.notes);
    return this.findOne(id);
  }

  async withdraw(id: string) {
    const applicant = await this.applicantModel.findById(id).exec();
    if (!applicant) throw new NotFoundException('Pendaftar tidak ditemukan');

    await this.pushStatusHistory(id, 'withdrawn', undefined, 'Mengundurkan diri');
    return this.findOne(id);
  }

  async checkResult(recruitmentId: string, nimOrEmail: string) {
    const filter = {
      recruitmentId: new Types.ObjectId(recruitmentId),
      $or: [
        { nim: nimOrEmail },
        { email: nimOrEmail.toLowerCase() }
      ]
    };
    const applicant = await this.applicantModel.findOne(filter).select('name status positionChoice interview statusHistory').exec();
    if (!applicant) throw new NotFoundException('Data pendaftaran tidak ditemukan');
    return applicant;
  }

  async getStats(recruitmentId: string) {
    const stats = await this.applicantModel.aggregate([
      { $match: { recruitmentId: new Types.ObjectId(recruitmentId) } },
      { $group: { _id: '$status', count: { $sum: 1 } } }
    ]);
    
    const result = {
      total: 0,
      waiting_review: 0,
      passed_review: 0,
      failed_review: 0,
      interview_scheduled: 0,
      interviewed: 0,
      accepted: 0,
      rejected: 0,
      withdrawn: 0
    };

    let total = 0;
    stats.forEach(s => {
      if (s._id in result) {
        result[s._id as keyof typeof result] = s.count;
      }
      total += s.count;
    });
    result.total = total;

    return result;
  }

  async exportData(recruitmentId: string, query: ApplicantQueryDto) {
    const { status, positionChoice, department, q } = query;
    const filter: Record<string, unknown> = { recruitmentId: new Types.ObjectId(recruitmentId) };
    if (status) filter.status = status;
    if (positionChoice) filter.positionChoice = positionChoice;
    if (department) filter.department = department;
    
    if (q) {
      filter.$or = [
        { name: { $regex: q, $options: 'i' } },
        { nim: { $regex: q, $options: 'i' } },
        { email: { $regex: q, $options: 'i' } }
      ];
    }
    
    // Convert to CSV for simplicity, or return raw data to be converted in controller
    const data = await this.applicantModel.find(filter)
      .populate('interview.interviewerId', 'name email')
      .exec();
    return data;
  }
}
