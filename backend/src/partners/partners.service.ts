import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Partner, PartnerDocument } from '../schemas/partner.schema';
import { CreatePartnerDto, UpdatePartnerDto, PartnerQueryDto } from './dto/partner.dto';

@Injectable()
export class PartnersService {
  constructor(
    @InjectModel(Partner.name)
    private partnerModel: Model<PartnerDocument>,
    private eventEmitter: EventEmitter2,
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
      this.partnerModel.find(filter).sort({ order: 1, createdAt: -1 }).skip(skip).limit(limit).populate('logo').exec(),
      this.partnerModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublic(type?: string, period?: string) {
    const filter: Record<string, unknown> = { isActive: true };
    if (type) filter['type'] = type;
    if (period) filter['period'] = period;
    return this.partnerModel.find(filter).sort({ order: 1 }).populate('logo').exec();
  }

  async findOne(id: string): Promise<PartnerDocument> {
    const partner = await this.partnerModel.findById(id).populate('logo').exec();
    if (!partner) throw new NotFoundException('Partner not found');
    return partner;
  }

  async create(dto: CreatePartnerDto): Promise<PartnerDocument> {
    const exists = await this.partnerModel.findOne({ slug: dto.slug }).exec();
    if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);

    const partner = new this.partnerModel(dto);
    await partner.save();

    this.eventEmitter.emit('audit.log', {
      action: 'CREATE', entity: 'Partner', entityId: (partner._id as unknown as string).toString(),
      after: partner.toObject(),
    });
    return partner;
  }

  async update(id: string, dto: UpdatePartnerDto): Promise<PartnerDocument> {
    if (dto.slug) {
      const exists = await this.partnerModel.findOne({ slug: dto.slug, _id: { $ne: id } }).exec();
      if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);
    }
    const before = await this.findOne(id);
    const partner = await this.partnerModel.findByIdAndUpdate(id, dto, { new: true }).populate('logo').exec();
    if (!partner) throw new NotFoundException('Partner not found');

    this.eventEmitter.emit('audit.log', {
      action: 'UPDATE', entity: 'Partner', entityId: id,
      before: before.toObject(), after: partner.toObject(),
    });
    return partner;
  }

  async remove(id: string): Promise<void> {
    const partner = await this.findOne(id);
    await this.partnerModel.findByIdAndDelete(id).exec();
    this.eventEmitter.emit('audit.log', {
      action: 'DELETE', entity: 'Partner', entityId: id, before: partner.toObject(),
    });
  }
}
