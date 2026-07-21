import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Partner, PartnerDocument } from '../schemas/partner.schema';
import { CreatePartnerDto, UpdatePartnerDto, PartnerQueryDto } from './dto/partner.dto';

@Injectable()
export class PartnersService {
  constructor(
    @InjectModel(Partner.name)
    private partnerModel: Model<PartnerDocument>,
  ) {}

  async findAll(query: PartnerQueryDto) {
    const { page = 1, limit = 20, q, type, period, isActive } = query;
    const filter: Record<string, unknown> = {};

    if (q) filter['name'] = { $regex: q, $options: 'i' };
    if (type) filter['type'] = type;
    if (period) filter['period'] = period;
    if (isActive !== undefined) filter['isActive'] = isActive;

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.partnerModel.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.partnerModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublic(type?: string, period?: string) {
    const filter: Record<string, unknown> = { isActive: true };
    if (type) filter['type'] = type;
    if (period) filter['period'] = period;
    return this.partnerModel.find(filter).sort({ order: 1 }).exec();
  }

  async findOne(id: string): Promise<PartnerDocument> {
    const partner = await this.partnerModel.findById(id).exec();
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
  }

  async create(dto: CreatePartnerDto): Promise<PartnerDocument> {
    const exists = await this.partnerModel.findOne({ slug: dto.slug }).exec();
    if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);

    const partner = new this.partnerModel(dto);
    await partner.save();
    return partner;
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<PartnerDocument> {
    if (dto.slug) {
      const exists = await this.partnerModel.findOne({ slug: dto.slug, _id: { $ne: id } }).exec();
      if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);
    }
    const partner = await this.partnerModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.partnerModel.findByIdAndDelete(id).exec();
  }
}
