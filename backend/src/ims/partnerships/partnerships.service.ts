import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Partnership } from '../../database/schema/ims';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';

@Injectable()
export class PartnershipsService {
  constructor(
    @InjectModel(Partnership.name) private partnerModel: Model<Partnership>,
  ) {}

  async list(query: any) {
    return paginate(this.partnerModel, {}, parsePaginationQuery(query), [
      'companyName',
    ]);
  }

  async create(data: any) {
    const p = await this.partnerModel.create(data);
    return { data: p, message: 'Mitra berhasil ditambahkan' };
  }

  async updateStatus(id: string, status: string) {
    const p = await this.partnerModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status } },
      { new: true },
    );
    if (!p) throw new NotFoundException('Mitra tidak ditemukan');
    return { data: p, message: `Status diubah ke ${status}` };
  }
}
