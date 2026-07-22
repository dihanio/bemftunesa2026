import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  Recruitment,
  RecruitmentDocument,
} from '../schemas/recruitment.schema';
import {
  CreateRecruitmentDto,
  UpdateRecruitmentDto,
  RecruitmentQueryDto,
} from './dto/recruitment.dto';

@Injectable()
export class RecruitmentService {
  constructor(
    @InjectModel(Recruitment.name)
    private recruitmentModel: Model<RecruitmentDocument>,
  ) {}

  async findAll(query: RecruitmentQueryDto) {
    const { page = 1, limit = 20, q, status } = query;
    const filter: Record<string, unknown> = {};
    if (q) filter['title'] = { $regex: q, $options: 'i' };
    if (status) filter['status'] = status;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.recruitmentModel
        .find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .exec(),
      this.recruitmentModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublic(status?: string) {
    const filter: Record<string, unknown> = {};
    if (status) filter['status'] = status;
    return this.recruitmentModel.find(filter).sort({ openDate: -1 }).exec();
  }

  async findBySlug(slug: string): Promise<RecruitmentDocument> {
    const rec = await this.recruitmentModel.findOne({ slug }).exec();
    if (!rec) throw new NotFoundException('Rekrutmen tidak ditemukan');
    return rec;
  }

  async findOne(id: string): Promise<RecruitmentDocument> {
    const rec = await this.recruitmentModel.findById(id).exec();
    if (!rec) throw new NotFoundException('Rekrutmen tidak ditemukan');
    return rec;
  }

  async create(dto: CreateRecruitmentDto): Promise<RecruitmentDocument> {
    const exists = await this.recruitmentModel
      .findOne({ slug: dto.slug })
      .exec();
    if (exists)
      throw new ConflictException(`Slug "${dto.slug}" sudah digunakan`);
    return new this.recruitmentModel(dto).save();
  }

  async update(
    id: string,
    dto: UpdateRecruitmentDto,
  ): Promise<RecruitmentDocument> {
    if (dto.slug) {
      const exists = await this.recruitmentModel
        .findOne({ slug: dto.slug, _id: { $ne: id } })
        .exec();
      if (exists)
        throw new ConflictException(`Slug "${dto.slug}" sudah digunakan`);
    }
    const rec = await this.recruitmentModel
      .findByIdAndUpdate(id, dto, { new: true })
      .exec();
    if (!rec) throw new NotFoundException('Rekrutmen tidak ditemukan');
    return rec;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.recruitmentModel.findByIdAndDelete(id).exec();
  }
}
