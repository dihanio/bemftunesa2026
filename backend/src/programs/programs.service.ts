import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Program, ProgramDocument } from '../schemas/program.schema';
import {
  CreateProgramDto,
  UpdateProgramDto,
  QueryProgramDto,
} from './dto/program.dto';

@Injectable()
export class ProgramsService {
  constructor(
    @InjectModel(Program.name) private programModel: Model<ProgramDocument>,
  ) {}

  async findAll(query: QueryProgramDto) {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (query.department)
      filter.department = new Types.ObjectId(query.department);
    if (query.status) filter.status = query.status;
    if (query.cabinetPeriod) filter.cabinetPeriod = query.cabinetPeriod;

    const data = await this.programModel
      .find(filter)
      .populate('pic', 'name')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .exec();

    return { data };
  }

  async findById(id: string) {
    const program = await this.programModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('pic', 'name email')
      .populate('department', 'name')
      .exec();
    if (!program) throw new NotFoundException('Program not found');
    return program;
  }

  async create(dto: CreateProgramDto) {
    const program = await this.programModel.create({
      ...dto,
      cabinetPeriod: dto.cabinetPeriod || '2026',
      department: new Types.ObjectId(dto.department),
      pic: dto.pic ? new Types.ObjectId(dto.pic) : undefined,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
    return program;
  }

  async update(
    id: string,
    dto: UpdateProgramDto,
    user?: {
      _id?: { toString(): string };
      role?: { slug?: string };
      department?: { toString(): string };
    },
  ) {
    const program = await this.findById(id);

    // Permission check: super-admin, kabem, PIC, or kadep of same department
    if (user) {
      const roleSlug = user.role?.slug || '';
      const userId = user._id?.toString();
      const allowedRoles = ['super-admin', 'kabem'];
      const isPic =
        program.pic &&
        (program.pic as { toString(): string })?.toString() === userId;
      const isKadepSameDept =
        roleSlug === 'kadep' &&
        user.department &&
        program.department &&
        user.department?.toString() ===
          (program.department as { toString(): string })?.toString();

      if (!allowedRoles.includes(roleSlug) && !isPic && !isKadepSameDept) {
        throw new ForbiddenException(
          'Anda tidak memiliki akses untuk mengedit proker ini',
        );
      }
    }

    if (dto.pic)
      program.pic = new Types.ObjectId(
        dto.pic,
      ) as unknown as typeof program.pic;
    if (dto.tor)
      program.tor = new Types.ObjectId(
        dto.tor,
      ) as unknown as typeof program.tor;
    if (dto.proposal)
      program.proposal = new Types.ObjectId(
        dto.proposal,
      ) as unknown as typeof program.proposal;
    if (dto.lpj)
      program.lpj = new Types.ObjectId(
        dto.lpj,
      ) as unknown as typeof program.lpj;

    Object.assign(program, {
      ...dto,
      pic: program.pic,
      tor: program.tor,
      proposal: program.proposal,
      lpj: program.lpj,
      startDate: dto.startDate ? new Date(dto.startDate) : program.startDate,
      endDate: dto.endDate ? new Date(dto.endDate) : program.endDate,
    });

    return program.save();
  }

  async delete(id: string) {
    const program = await this.findById(id);
    program.deletedAt = new Date();
    await program.save();
    return { deleted: true };
  }

  async getStats() {
    const filter = { deletedAt: { $exists: false } };

    const total = await this.programModel.countDocuments(filter);
    const planning = await this.programModel.countDocuments({
      ...filter,
      status: 'planning',
    });
    const active = await this.programModel.countDocuments({
      ...filter,
      status: 'active',
    });
    const completed = await this.programModel.countDocuments({
      ...filter,
      status: 'completed',
    });

    return {
      total: { label: 'Total Proker', value: total },
      planning: {
        label: 'Perencanaan',
        value: planning,
        color: 'warning' as const,
      },
      active: {
        label: 'Sedang Berjalan',
        value: active,
        color: 'primary' as const,
      },
      completed: {
        label: 'Selesai',
        value: completed,
        color: 'success' as const,
      },
    };
  }
}
