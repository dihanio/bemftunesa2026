import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { WikiArticle } from '../../database/schema/ims';
import {
  paginate,
  parsePaginationQuery,
} from '../../common/helpers/pagination.helper';

@Injectable()
export class WikiService {
  constructor(
    @InjectModel(WikiArticle.name) private wikiModel: Model<WikiArticle>,
  ) {}

  // Generate URL friendly slug from title
  private slugify(text: string): string {
    return text
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-') // Replace spaces with -
      .replace(/[^\w\-]+/g, '') // Remove all non-word chars
      .replace(/\-\-+/g, '-') // Replace multiple - with single -
      .replace(/^-+/, '') // Trim - from start
      .replace(/-+$/, ''); // Trim - from end
  }

  async list(query: any) {
    const parsed = parsePaginationQuery(query);
    const paginated = await paginate(this.wikiModel, {}, parsed, [
      'title',
      'content',
    ]);
    paginated.data = await this.wikiModel.populate(paginated.data, [
      { path: 'authorId', select: 'name role' },
    ]);
    return paginated;
  }

  async findOneBySlug(slug: string) {
    const article = await this.wikiModel
      .findOne({ slug, deletedAt: null })
      .populate('authorId', 'name nim role email');
    if (!article) throw new NotFoundException('Artikel Wiki tidak ditemukan');
    return { data: article };
  }

  async create(data: any) {
    let slug = this.slugify(data.title);

    // Check if slug is unique, append numbers if not
    const exists = await this.wikiModel.findOne({ slug, deletedAt: null });
    if (exists) {
      slug = `${slug}-${Math.floor(100 + Math.random() * 900)}`;
    }

    const article = await this.wikiModel.create({
      ...data,
      slug,
    });
    return { data: article, message: 'Artikel Wiki berhasil diterbitkan' };
  }

  async update(id: string, data: any) {
    const updateData = { ...data };
    if (data.title) {
      updateData.slug = this.slugify(data.title);
    }

    const article = await this.wikiModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: updateData },
      { new: true },
    );
    if (!article) throw new NotFoundException('Artikel Wiki tidak ditemukan');
    return { data: article, message: 'Artikel Wiki berhasil diperbarui' };
  }

  async delete(id: string) {
    const article = await this.wikiModel.findOneAndUpdate(
      { _id: id, deletedAt: null },
      { $set: { deletedAt: new Date() } },
      { new: true },
    );
    if (!article) throw new NotFoundException('Artikel Wiki tidak ditemukan');
    return { message: 'Artikel Wiki berhasil dihapus' };
  }
}
