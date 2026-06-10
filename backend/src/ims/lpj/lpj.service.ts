import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { LPJ, SPJ } from '../../database/schema/finance';
import { Proker } from '../../database/schema/proker';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';

@Injectable()
export class LpjService {
  constructor(
    @InjectModel(LPJ.name) private lpjModel: Model<LPJ>,
    @InjectModel(SPJ.name) private spjModel: Model<SPJ>,
    @InjectModel(Proker.name) private prokerModel: Model<Proker>,
  ) {}

  async listLpj(query: any, userDeptId?: string, isBPI: boolean = true) {
    const options = parsePaginationQuery(query);
    const filter: any = { deletedAt: null };

    if (!isBPI && userDeptId) {
      const deptObjectId =
        typeof userDeptId === 'string'
          ? new Types.ObjectId(userDeptId)
          : userDeptId;
      const prokers = await this.prokerModel
        .find({ departmentId: deptObjectId, deletedAt: null })
        .select('_id')
        .lean()
        .exec();
      const prokerIds = prokers.map((p) => p._id);
      filter.prokerId = { $in: prokerIds };
    }

    return paginate(this.lpjModel, filter, options, []);
  }

  async createLpj(data: any) {
    const lpj = await this.lpjModel.create(data);
    return { data: lpj, message: 'LPJ berhasil disubmit' };
  }

  async createSpj(data: any) {
    const spj = await this.spjModel.create(data);
    return { data: spj, message: 'Bukti SPJ berhasil diupload' };
  }

  async listSpj(query: any, userDeptId?: string, isBPI: boolean = true) {
    const options = parsePaginationQuery(query);
    const filter: any = { deletedAt: null };

    if (!isBPI && userDeptId) {
      const deptObjectId =
        typeof userDeptId === 'string'
          ? new Types.ObjectId(userDeptId)
          : userDeptId;
      const prokers = await this.prokerModel
        .find({ departmentId: deptObjectId, deletedAt: null })
        .select('_id')
        .lean()
        .exec();
      const prokerIds = prokers.map((p) => p._id);
      filter.prokerId = { $in: prokerIds };
    }

    return paginate(this.spjModel, filter, options, ['description']);
  }

  async validateLpj(id: string) {
    const lpj = await this.lpjModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status: 'Validated' } },
      { new: true },
    );
    if (!lpj) throw new NotFoundException('LPJ tidak ditemukan');
    return { data: lpj, message: 'LPJ berhasil divalidasi' };
  }
}
