import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { Department, DepartmentDocument } from '../schemas/department.schema';
import {
  CreateDepartmentDto,
  UpdateDepartmentDto,
  DepartmentQueryDto,
} from './dto/department.dto';
import {
  buildPaginateQuery,
  buildPaginateResponse,
} from '../common/dto/pagination.dto';
import type { UserDocument } from '../schemas/user.schema';

const toStr = (id: unknown): string => (id as { toString(): string }).toString();

@Injectable()
export class DepartmentsService {
  constructor(
    @InjectModel(Department.name)
    private departmentModel: Model<DepartmentDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: DepartmentQueryDto) {
    const { skip, limit, sortObj } = buildPaginateQuery(query);
    const filter: Record<string, unknown> = {};

    if (query.isActive !== undefined) filter.isActive = query.isActive;
    if ((query as any).cabinetPeriod) filter.cabinetPeriod = new Types.ObjectId((query as any).cabinetPeriod);
    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
      ];
    }

    const [data, total] = await Promise.all([
      this.departmentModel
        .find(filter)
        .populate('logo', 'url alt filename')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.departmentModel.countDocuments(filter).exec(),
    ]);

    return buildPaginateResponse(data, total, query);
  }

  async findById(id: string) {
    const department = await this.departmentModel
      .findById(id)
      .populate('logo', 'url alt filename thumbnail')
      .exec();
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async findBySlug(slug: string) {
    const department = await this.departmentModel
      .findOne({ slug })
      .populate('logo', 'url alt filename thumbnail')
      .exec();
    if (!department) throw new NotFoundException('Department not found');
    return department;
  }

  async create(dto: CreateDepartmentDto, user: UserDocument) {
    const existing = await this.departmentModel
      .findOne({ slug: dto.slug })
      .exec();
    if (existing) {
      throw new BadRequestException('Department slug already exists');
    }

    const toObjectId = (id: string | undefined) =>
      id ? new Types.ObjectId(id) : undefined;

    const department = await this.departmentModel.create({
      ...dto,
      cabinetPeriod: toObjectId(dto.cabinetPeriod),
      logo: toObjectId(dto.logo),
    });

    this.eventEmitter.emit('content.created', {
      user: toStr(user._id),
      userName: user.name,
      entity: 'department',
      entityId: toStr(department._id),
      summary: `Created department: "${department.name}"`,
    });

    return department;
  }

  async update(id: string, dto: UpdateDepartmentDto, user: UserDocument) {
    const department = await this.departmentModel.findById(id).exec();
    if (!department) throw new NotFoundException('Department not found');

    const before = department.toObject();
    const toObjectId = (id: string | undefined) =>
      id ? new Types.ObjectId(id) : undefined;

    Object.assign(department, {
      ...dto,
      logo: dto.logo ? toObjectId(dto.logo) : department.logo,
    });

    const saved = await department.save();

    this.eventEmitter.emit('content.updated', {
      user: toStr(user._id),
      userName: user.name,
      entity: 'department',
      entityId: id,
      summary: `Updated department: "${department.name}"`,
      changes: { before, after: saved.toObject() },
    });

    return saved;
  }

  async delete(id: string, user: UserDocument) {
    const department = await this.departmentModel.findById(id).exec();
    if (!department) throw new NotFoundException('Department not found');

    await department.deleteOne();

    this.eventEmitter.emit('content.deleted', {
      user: toStr(user._id),
      userName: user.name,
      entity: 'department',
      entityId: id,
      summary: `Deleted department: "${department.name}"`,
    });

    return { deleted: true };
  }
}
