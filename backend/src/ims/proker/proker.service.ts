import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Proker, ProkerMember, Committee } from '../../database/schema/proker';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';

@Injectable()
export class ProkerService {
  constructor(
    @InjectModel(Proker.name) private prokerModel: Model<Proker>,
    @InjectModel(ProkerMember.name)
    private prokerMemberModel: Model<ProkerMember>,
    @InjectModel(Committee.name) private committeeModel: Model<Committee>,
  ) {}

  async list(query: any) {
    const options = parsePaginationQuery(query);
    const filter: any = {};
    if (query.departmentId) filter.departmentId = query.departmentId;
    return paginate(this.prokerModel, filter, options, [
      'title',
      'description',
    ]);
  }

  async create(data: any) {
    const proker = await this.prokerModel.create(data);
    return { data: proker, message: 'Program kerja berhasil dibuat' };
  }

  async update(id: string, data: any) {
    const proker = await this.prokerModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: data },
      { new: true },
    );
    if (!proker) throw new NotFoundException('Program kerja tidak ditemukan');
    return { data: proker, message: 'Program kerja berhasil diupdate' };
  }

  async updateProgress(id: string, data: any) {
    const update: any = { progress: data.progress };
    if (data.status) update.status = data.status;
    const proker = await this.prokerModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: update },
      { new: true },
    );
    if (!proker) throw new NotFoundException('Program kerja tidak ditemukan');
    return { data: proker, message: 'Progress berhasil diupdate' };
  }

  async listMembers(prokerId: string) {
    const members = await this.prokerMemberModel
      .find({ prokerId, deletedAt: null })
      .populate('userId', 'name email avatar role');
    return { data: members };
  }

  async assignMember(prokerId: string, data: any) {
    // 1. Create in ProkerMember (backwards-compatibility)
    const member = await this.prokerMemberModel.create({
      prokerId,
      userId: data.userId,
      roleInProker: data.roleInProker,
    });

    // 2. Create in Committee (which is used by guards, overview, and frontend lists!)
    await this.committeeModel.create({
      prokerId,
      userId: data.userId,
      position: data.roleInProker,
      division: data.division,
      period: '2026',
    });

    return {
      data: member,
      message: 'Anggota panitia pelaksana berhasil ditambahkan',
    };
  }
}
