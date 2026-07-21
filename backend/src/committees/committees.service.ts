import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Committee, CommitteeDocument, CommitteeMember } from '../schemas/committee.schema';
import { CreateCommitteeDto, UpdateCommitteeDto, AddMemberDto } from './dto/committee.dto';

@Injectable()
export class CommitteesService {
  constructor(
    @InjectModel(Committee.name) private committeeModel: Model<CommitteeDocument>,
  ) {}

  async findAll(programId?: string) {
    const filter: Record<string, unknown> = {};
    if (programId) filter.programId = new Types.ObjectId(programId);

    return this.committeeModel
      .find(filter)
      .populate('programId', 'title department')
      .populate('members.userId', 'name nim email avatar')
      .sort({ createdAt: -1 })
      .exec();
  }

  async findById(id: string) {
    const committee = await this.committeeModel
      .findById(id)
      .populate('programId', 'title department status')
      .populate('members.userId', 'name nim email avatar studyProgram batch')
      .exec();
    if (!committee) throw new NotFoundException('Kepanitiaan tidak ditemukan');
    return committee;
  }

  async findByProgramId(programId: string) {
    return this.committeeModel
      .findOne({ programId: new Types.ObjectId(programId) })
      .populate('members.userId', 'name nim email avatar')
      .exec();
  }

  async create(dto: CreateCommitteeDto) {
    const existing = await this.committeeModel.findOne({ programId: new Types.ObjectId(dto.programId) });
    if (existing) throw new ConflictException('Program Kerja ini sudah memiliki kepanitiaan');

    const members = (dto.members || []).map(m => ({
      userId: new Types.ObjectId(m.userId),
      role: m.role,
      joinedAt: new Date(),
    }));

    return this.committeeModel.create({
      programId: new Types.ObjectId(dto.programId),
      name: dto.name,
      description: dto.description,
      members,
    });
  }

  async update(id: string, dto: UpdateCommitteeDto) {
    const committee = await this.findById(id);
    if (dto.name) committee.name = dto.name;
    if (dto.description !== undefined) committee.description = dto.description;
    if (dto.isActive !== undefined) committee.isActive = dto.isActive;
    return committee.save();
  }

  async addMember(id: string, dto: AddMemberDto) {
    const committee = await this.findById(id);
    const alreadyMember = committee.members.some(
      m => m.userId.toString() === dto.userId,
    );
    if (alreadyMember) throw new ConflictException('Anggota sudah terdaftar di kepanitiaan ini');

    committee.members.push({
      userId: new Types.ObjectId(dto.userId),
      role: dto.role,
      joinedAt: new Date(),
    } as CommitteeMember);

    return committee.save();
  }

  async removeMember(id: string, userId: string) {
    const committee = await this.findById(id);
    committee.members = committee.members.filter(
      m => m.userId.toString() !== userId,
    ) as CommitteeMember[];
    return committee.save();
  }

  async delete(id: string) {
    const committee = await this.findById(id);
    await this.committeeModel.findByIdAndDelete(id).exec();
    return { deleted: true };
  }
}
