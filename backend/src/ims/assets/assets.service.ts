import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Asset, AssetLoan } from '../../database/schema/ims';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';

@Injectable()
export class AssetsService {
  constructor(
    @InjectModel(Asset.name) private assetModel: Model<Asset>,
    @InjectModel(AssetLoan.name) private loanModel: Model<AssetLoan>,
  ) {}

  async listAssets(query: any) {
    return paginate(this.assetModel, {}, parsePaginationQuery(query), [
      'name',
      'code',
    ]);
  }
  async createAsset(data: any) {
    const a = await this.assetModel.create(data);
    return { data: a, message: 'Aset berhasil ditambahkan' };
  }
  async listLoans(query: any) {
    const paginated = await paginate(
      this.loanModel,
      {},
      parsePaginationQuery(query),
      [],
    );
    paginated.data = await this.loanModel.populate(paginated.data, [
      { path: 'assetId', select: 'name code' },
      { path: 'borrowerId', select: 'name nim role' },
    ]);
    return paginated;
  }
  async createLoan(data: any) {
    const l = await this.loanModel.create(data);
    return { data: l, message: 'Pengajuan peminjaman berhasil' };
  }

  async updateLoanStatus(id: string, status: string) {
    const loan = await this.loanModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { status } },
      { new: true },
    );
    if (!loan) throw new NotFoundException('Peminjaman tidak ditemukan');
    return { data: loan, message: `Status peminjaman diubah ke ${status}` };
  }
}
