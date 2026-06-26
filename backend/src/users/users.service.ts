import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { User, UserDocument } from '../schemas/user.schema';
import { Role, RoleDocument } from '../schemas/role.schema';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import {
  PaginationQueryDto,
  buildPaginateQuery,
  buildPaginateResponse,
} from '../common/dto/pagination.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectModel(User.name)
    private userModel: Model<UserDocument>,
    @InjectModel(Role.name)
    private roleModel: Model<RoleDocument>,
  ) {}

  async findAll(query: PaginationQueryDto & { search?: string; role?: string }) {
    const { skip, limit, sortObj } = buildPaginateQuery(query);
    const filter: Record<string, unknown> = {};

    if (query.search) {
      filter.$or = [
        { name: { $regex: query.search, $options: 'i' } },
        { email: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.role) {
      filter.role = new Types.ObjectId(query.role);
    }

    const [data, total] = await Promise.all([
      this.userModel
        .find(filter)
        .populate('role')
        .populate('avatar')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.userModel.countDocuments(filter).exec(),
    ]);

    return buildPaginateResponse(data, total, query);
  }

  async findById(id: string) {
    const user = await this.userModel
      .findById(id)
      .populate({ path: 'role', populate: { path: 'permissions' } })
      .populate('avatar')
      .exec();
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async create(dto: CreateUserDto) {
    const existing = await this.userModel.findOne({ email: dto.email }).exec();
    if (existing) throw new BadRequestException('Email already registered');

    const role = await this.roleModel.findById(dto.roleId).exec();
    if (!role) throw new NotFoundException('Role not found');

    return this.userModel.create({
      cabinetPeriod: new Types.ObjectId(dto.cabinetPeriod),
      department: dto.department ? new Types.ObjectId(dto.department) : undefined,
      name: dto.name,
      nim: dto.nim,
      email: dto.email,
      phone: dto.phone,
      position: dto.position,
      role: new Types.ObjectId(dto.roleId),
      avatar: dto.avatar ? new Types.ObjectId(dto.avatar) : undefined,
    });
  }

  async update(id: string, dto: UpdateUserDto) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');

    if (dto.roleId) {
      const role = await this.roleModel.findById(dto.roleId).exec();
      if (!role) throw new NotFoundException('Role not found');
      user.role = new Types.ObjectId(dto.roleId) as unknown as typeof user.role;
    }

    if (dto.department !== undefined) user.department = (dto.department ? new Types.ObjectId(dto.department) : undefined) as any;
    if (dto.name !== undefined) user.name = dto.name;
    if (dto.nim !== undefined) user.nim = dto.nim;
    if (dto.email !== undefined) user.email = dto.email;
    if (dto.phone !== undefined) user.phone = dto.phone;
    if (dto.position !== undefined) user.position = dto.position;
    if (dto.isActive !== undefined) user.isActive = dto.isActive;
    if (dto.avatar !== undefined)
      user.avatar = (dto.avatar ? new Types.ObjectId(dto.avatar) : undefined) as unknown as typeof user.avatar;

    return user.save();
  }

  async delete(id: string) {
    const user = await this.userModel.findById(id).exec();
    if (!user) throw new NotFoundException('User not found');
    user.isActive = false;
    await user.save();
    return { deleted: true };
  }
}
