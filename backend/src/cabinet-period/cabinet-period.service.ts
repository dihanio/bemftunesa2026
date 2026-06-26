import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CabinetPeriod, CabinetPeriodDocument } from '../schemas/cabinet-period.schema';
import { CreateCabinetPeriodDto, UpdateCabinetPeriodDto, QueryCabinetPeriodDto } from './dto/cabinet-period.dto';

@Injectable()
export class CabinetPeriodService {
  constructor(
    @InjectModel(CabinetPeriod.name) private cabinetModel: Model<CabinetPeriodDocument>,
  ) {}

  async findAll(query: QueryCabinetPeriodDto) {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (query.status) {
      filter.status = query.status;
    }
    
    const data = await this.cabinetModel.find(filter).sort({ startDate: -1 }).exec();
    return { data };
  }

  async findById(id: string) {
    const cabinet = await this.cabinetModel.findOne({ _id: id, deletedAt: { $exists: false } }).exec();
    if (!cabinet) throw new NotFoundException('Cabinet Period not found');
    return cabinet;
  }

  async create(dto: CreateCabinetPeriodDto) {
    const existing = await this.cabinetModel.findOne({ name: dto.name, deletedAt: { $exists: false } }).exec();
    if (existing) {
      throw new BadRequestException('Cabinet Period with this name already exists');
    }

    const cabinet = await this.cabinetModel.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
    });

    return cabinet;
  }

  async update(id: string, dto: UpdateCabinetPeriodDto) {
    const cabinet = await this.findById(id);

    if (dto.name && dto.name !== cabinet.name) {
      const existing = await this.cabinetModel.findOne({ name: dto.name, deletedAt: { $exists: false } }).exec();
      if (existing) {
        throw new BadRequestException('Cabinet Period with this name already exists');
      }
    }

    if (dto.status === 'active') {
      // Deactivate all other active periods
      await this.cabinetModel.updateMany(
        { status: 'active', _id: { $ne: id } },
        { status: 'archived' }
      );
    }

    Object.assign(cabinet, {
      ...dto,
      startDate: dto.startDate ? new Date(dto.startDate) : cabinet.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : cabinet.endDate,
    });

    return cabinet.save();
  }

  async delete(id: string) {
    const cabinet = await this.findById(id);
    cabinet.deletedAt = new Date();
    await cabinet.save();
    return { deleted: true };
  }
}
