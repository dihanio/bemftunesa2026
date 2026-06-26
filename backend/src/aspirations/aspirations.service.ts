import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Aspiration, AspirationDocument } from '../schemas/aspiration.schema';
import { CreateAspirationDto, UpdateAspirationDto, QueryAspirationDto } from './dto/aspiration.dto';

@Injectable()
export class AspirationsService {
  constructor(
    @InjectModel(Aspiration.name) private aspirationModel: Model<AspirationDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: QueryAspirationDto) {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (query.status) filter.status = query.status;
    if (query.urgency) filter.urgency = query.urgency;
    if (query.cabinetPeriod) filter.cabinetPeriod = new Types.ObjectId(query.cabinetPeriod);

    const data = await this.aspirationModel
      .find(filter)
      .populate('submitter', 'name email')
      .populate('assignedDepartment', 'name')
      .sort({ dateSubmitted: -1 })
      .exec();
    
    return { data };
  }

  async findById(id: string) {
    const aspiration = await this.aspirationModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('submitter', 'name email')
      .populate('assignedDepartment', 'name')
      .exec();
    if (!aspiration) throw new NotFoundException('Aspiration not found');
    return aspiration;
  }

  async create(dto: CreateAspirationDto, userId?: string) {
    // SLA metrics calculation
    const now = new Date();
    const targetResponseDate = new Date(now);
    if (dto.urgency === 'urgent') targetResponseDate.setDate(targetResponseDate.getDate() + 1);
    else if (dto.urgency === 'high') targetResponseDate.setDate(targetResponseDate.getDate() + 3);
    else targetResponseDate.setDate(targetResponseDate.getDate() + 7); // Default 7 days

    const aspiration = await this.aspirationModel.create({
      ...dto,
      cabinetPeriod: new Types.ObjectId(dto.cabinetPeriod),
      submitter: userId && !dto.isAnonymous ? new Types.ObjectId(userId) : undefined,
      dateSubmitted: now,
      targetResponseDate,
    });

    this.eventEmitter.emit('aspiration.new', {
      aspirationId: aspiration._id.toString(),
      title: aspiration.title,
    });

    return aspiration;
  }

  async update(id: string, dto: UpdateAspirationDto) {
    const aspiration = await this.findById(id);

    // SLA tracking
    if (dto.status === 'processing' && aspiration.status === 'new') {
      aspiration.firstResponseDate = new Date();
    }
    if (dto.status && ['resolved', 'rejected'].includes(dto.status) && !aspiration.resolutionDate) {
      aspiration.resolutionDate = new Date();
    }

    if (dto.assignedDepartment) {
      aspiration.assignedDepartment = new Types.ObjectId(dto.assignedDepartment) as any;
    }
    if (dto.status) aspiration.status = dto.status;
    if (dto.officialResponse) aspiration.officialResponse = dto.officialResponse;

    return aspiration.save();
  }

  async delete(id: string) {
    const aspiration = await this.findById(id);
    aspiration.deletedAt = new Date();
    await aspiration.save();
    return { deleted: true };
  }
}
