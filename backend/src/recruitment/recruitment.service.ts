import {
  Injectable, NotFoundException, ConflictException, BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Recruitment, RecruitmentDocument } from '../schemas/recruitment.schema';
import type { UserDocument } from '../schemas/user.schema';
import {
  CreateRecruitmentDto, UpdateRecruitmentDto,
  UpdateRecruitmentStatusDto, RecruitmentQueryDto,
} from './dto/recruitment.dto';

@Injectable()
export class RecruitmentService {
  constructor(
    @InjectModel(Recruitment.name)
    private recruitmentModel: Model<RecruitmentDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: RecruitmentQueryDto) {
    const { page = 1, limit = 10, q, status, period } = query;
    const filter: Record<string, unknown> = {};

    if (q) filter['title'] = { $regex: q, $options: 'i' };
    if (status) filter['status'] = status;
    if (period) filter['period'] = period;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.recruitmentModel.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate('poster', 'url alt')
        .populate('createdBy', 'name email')
        .exec(),
      this.recruitmentModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublic(status?: string) {
    const filter: Record<string, unknown> = {};
    // Public only shows open and announced recruitments
    filter['status'] = status ?? { $in: ['open', 'announced'] };
    return this.recruitmentModel
      .find(filter)
      .sort({ createdAt: -1 })
      .populate('poster', 'url alt')
      .exec();
  }

  async findOneBySlug(slug: string): Promise<RecruitmentDocument> {
    const rec = await this.recruitmentModel.findOne({ slug }).populate('poster', 'url alt').exec();
    if (!rec) throw new NotFoundException('Recruitment not found');
    return rec;
  }

  async findOne(id: string): Promise<RecruitmentDocument> {
    const rec = await this.recruitmentModel.findById(id).populate('poster', 'url alt').exec();
    if (!rec) throw new NotFoundException('Recruitment not found');
    return rec;
  }

  async create(dto: CreateRecruitmentDto, user: UserDocument): Promise<RecruitmentDocument> {
    const exists = await this.recruitmentModel.findOne({ slug: dto.slug }).exec();
    if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);

    const rec = new this.recruitmentModel({
      ...dto,
      createdBy: (user._id as unknown as string).toString(),
    });
    await rec.save();

    this.eventEmitter.emit('audit.log', {
      action: 'CREATE', entity: 'Recruitment', entityId: (rec._id as unknown as string).toString(),
      after: rec.toObject(), performedBy: (user._id as unknown as string).toString(),
    });
    return rec;
  }

  async update(id: string, dto: UpdateRecruitmentDto, user: UserDocument): Promise<RecruitmentDocument> {
    if (dto.slug) {
      const exists = await this.recruitmentModel.findOne({ slug: dto.slug, _id: { $ne: id } }).exec();
      if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);
    }

    const before = await this.findOne(id);
    const rec = await this.recruitmentModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!rec) throw new NotFoundException('Recruitment not found');

    this.eventEmitter.emit('audit.log', {
      action: 'UPDATE', entity: 'Recruitment', entityId: id,
      before: before.toObject(), after: rec.toObject(), performedBy: (user._id as unknown as string).toString(),
    });
    return rec;
  }

  async updateStatus(id: string, dto: UpdateRecruitmentStatusDto, user: UserDocument): Promise<RecruitmentDocument> {
    const rec = await this.findOne(id);
    const allowed = this.getAllowedTransitions(rec.status);
    if (!allowed.includes(dto.status)) {
      throw new BadRequestException(`Cannot transition from "${rec.status}" to "${dto.status}". Allowed: ${allowed.join(', ')}`);
    }

    rec.status = dto.status;
    await rec.save();

    this.eventEmitter.emit('audit.log', {
      action: 'STATUS_CHANGE', entity: 'Recruitment', entityId: id,
      meta: { from: rec.status, to: dto.status }, performedBy: (user._id as unknown as string).toString(),
    });
    return rec;
  }

  private getAllowedTransitions(current: string): string[] {
    const map: Record<string, string[]> = {
      draft: ['open'],
      open: ['closed', 'draft'],
      closed: ['announced', 'open'],
      announced: ['closed'],
    };
    return map[current] ?? [];
  }

  async remove(id: string, user: UserDocument): Promise<void> {
    const rec = await this.findOne(id);
    await this.recruitmentModel.findByIdAndDelete(id).exec();
    this.eventEmitter.emit('audit.log', {
      action: 'DELETE', entity: 'Recruitment', entityId: id,
      before: rec.toObject(), performedBy: (user._id as unknown as string).toString(),
    });
  }
}
