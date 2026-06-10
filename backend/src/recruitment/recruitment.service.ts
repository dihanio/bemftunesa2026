import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Applicant } from '../database/schema/recruitment';
import { RecruitmentScore } from '../database/schema/recruitment';
import {
  paginate,
  parsePaginationQuery,
} from '../common/helpers/pagination.helper';
import {
  ApplyRecruitmentDto,
  ScoreApplicantDto,
  UploadBerkasDto,
} from './recruitment.dto';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Injectable()
export class RecruitmentService {
  constructor(
    @InjectModel(Applicant.name) private applicantModel: Model<Applicant>,
    @InjectModel(RecruitmentScore.name)
    private scoreModel: Model<RecruitmentScore>,
  ) {}

  async apply(data: ApplyRecruitmentDto) {
    const existing = await this.applicantModel.findOne({ nim: data.nim });
    if (existing) throw new ConflictException('NIM sudah terdaftar');
    const applicant = await this.applicantModel.create(data);
    return {
      data: { id: applicant._id, nim: applicant.nim },
      message: 'Pendaftaran berhasil',
    };
  }

  async uploadBerkas(data: UploadBerkasDto) {
    const { nim, cvUrl, photoUrl, portfolioUrl } = data;
    const applicant = await this.applicantModel.findOneAndUpdate(
      { nim },
      {
        $set: {
          ...(cvUrl && { cvUrl }),
          ...(photoUrl && { photoUrl }),
          ...(portfolioUrl && { portfolioUrl }),
        },
      },
      { new: true },
    );
    if (!applicant) throw new NotFoundException('Pendaftar tidak ditemukan');
    return { data: applicant, message: 'Berkas berhasil diupload' };
  }

  async checkStatus(nim: string) {
    const applicant = await this.applicantModel
      .findOne({ nim })
      .select('fullName nim status');
    if (!applicant) throw new NotFoundException('NIM tidak ditemukan');
    return { data: applicant };
  }

  async getResults() {
    const accepted = await this.applicantModel
      .find({ status: 'Accepted', deletedAt: null })
      .select('fullName nim')
      .sort({ fullName: 1 });
    return { data: accepted };
  }

  async listApplicants(query: PaginationQueryDto) {
    const paginated = await paginate(
      this.applicantModel,
      {},
      parsePaginationQuery(query),
      ['fullName', 'nim', 'email'],
    );

    paginated.data = await this.applicantModel.populate(paginated.data, [
      { path: 'firstChoiceDeptId', select: 'name code' },
      { path: 'secondChoiceDeptId', select: 'name code' },
      { path: 'firstChoiceProkerId', select: 'title slug' },
      { path: 'secondChoiceProkerId', select: 'title slug' },
    ]);

    return paginated;
  }

  async score(data: ScoreApplicantDto, interviewerId: string) {
    const score = await this.scoreModel.create({ ...data, interviewerId });
    return { data: score, message: 'Skor berhasil diinput' };
  }

  async updateApplicantStatus(id: string, status: string) {
    const applicant = await this.applicantModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status } },
      { new: true },
    );
    if (!applicant) throw new NotFoundException('Pendaftar tidak ditemukan');
    return { data: applicant, message: `Status diubah ke ${status}` };
  }
}
