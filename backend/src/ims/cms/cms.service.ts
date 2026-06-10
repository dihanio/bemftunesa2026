import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Article } from '../../database/schema/articles';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';

@Injectable()
export class CmsService {
  constructor(
    @InjectModel(Article.name) private articleModel: Model<Article>,
  ) {}

  async list(query: any) {
    // CMS sees all articles including drafts
    const options = parsePaginationQuery(query);
    const filter: any = { deletedAt: null };
    return paginate(this.articleModel, filter, options, ['title', 'content']);
  }

  async create(data: any) {
    const article = await this.articleModel.create(data);
    return { data: article, message: 'Artikel berhasil dibuat' };
  }

  async update(id: string, data: any) {
    const article = await this.articleModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: data },
      { new: true },
    );
    if (!article) throw new NotFoundException('Artikel tidak ditemukan');
    return { data: article, message: 'Artikel berhasil diupdate' };
  }

  async softDelete(id: string) {
    const article = await this.articleModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!article) throw new NotFoundException('Artikel tidak ditemukan');
    return { message: 'Artikel berhasil dihapus' };
  }
}
