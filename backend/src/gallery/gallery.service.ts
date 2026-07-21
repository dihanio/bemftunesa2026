import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Gallery, GalleryDocument } from '../schemas/gallery.schema';
import { CreateGalleryDto, UpdateGalleryDto, GalleryQueryDto } from './dto/gallery.dto';

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(Gallery.name) private galleryModel: Model<GalleryDocument>,
  ) {}

  async findAll(query: GalleryQueryDto) {
    const { page = 1, limit = 20, q } = query;
    const filter: Record<string, unknown> = {};
    if (q) filter['title'] = { $regex: q, $options: 'i' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.galleryModel.find(filter).sort({ eventDate: -1, createdAt: -1 }).skip(skip).limit(limit).exec(),
      this.galleryModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublic(search?: string) {
    const filter: Record<string, unknown> = { isPublished: true };
    if (search) filter['title'] = { $regex: search, $options: 'i' };
    return this.galleryModel.find(filter).sort({ eventDate: -1 }).exec();
  }

  async findBySlug(slug: string): Promise<GalleryDocument> {
    const gallery = await this.galleryModel.findOne({ slug, isPublished: true }).exec();
    if (!gallery) throw new NotFoundException('Album tidak ditemukan');
    return gallery;
  }

  async findOne(id: string): Promise<GalleryDocument> {
    const gallery = await this.galleryModel.findById(id).exec();
    if (!gallery) throw new NotFoundException('Album tidak ditemukan');
    return gallery;
  }

  async create(dto: CreateGalleryDto): Promise<GalleryDocument> {
    const exists = await this.galleryModel.findOne({ slug: dto.slug }).exec();
    if (exists) throw new ConflictException(`Slug "${dto.slug}" sudah digunakan`);
    return new this.galleryModel(dto).save();
  }

  async update(id: string, dto: UpdateGalleryDto): Promise<GalleryDocument> {
    if (dto.slug) {
      const exists = await this.galleryModel.findOne({ slug: dto.slug, _id: { $ne: id } }).exec();
      if (exists) throw new ConflictException(`Slug "${dto.slug}" sudah digunakan`);
    }
    const gallery = await this.galleryModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!gallery) throw new NotFoundException('Album tidak ditemukan');
    return gallery;
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.galleryModel.findByIdAndDelete(id).exec();
  }
}
