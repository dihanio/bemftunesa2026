import {
  Injectable, NotFoundException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Gallery, GalleryDocument } from '../schemas/gallery.schema';
import type { UserDocument } from '../schemas/user.schema';
import {
  CreateGalleryDto, UpdateGalleryDto,
  UpdateGalleryStatusDto, AddPhotosDto, GalleryQueryDto,
} from './dto/gallery.dto';

@Injectable()
export class GalleryService {
  constructor(
    @InjectModel(Gallery.name)
    private galleryModel: Model<GalleryDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: GalleryQueryDto) {
    const { page = 1, limit = 12, q, status, tag } = query;
    const filter: Record<string, unknown> = {};

    if (q) filter['title'] = { $regex: q, $options: 'i' };
    if (status) filter['status'] = status;
    if (tag) filter['tags'] = { $in: [tag] };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.galleryModel.find(filter)
        .select('-photos')   // exclude full photos array in list view for performance
        .sort({ order: 1, eventDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('cover', 'url alt thumbnailUrl')
        .populate('createdBy', 'name')
        .exec(),
      this.galleryModel.countDocuments(filter),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublic(query: GalleryQueryDto) {
    const filter: Record<string, unknown> = { status: 'published' };
    const { tag, q, page = 1, limit = 12 } = query;
    if (tag) filter['tags'] = { $in: [tag] };
    if (q) filter['title'] = { $regex: q, $options: 'i' };

    const skip = (page - 1) * limit;
    const [data, total] = await Promise.all([
      this.galleryModel.find(filter)
        .select('-photos')
        .sort({ order: 1, eventDate: -1 })
        .skip(skip)
        .limit(limit)
        .populate('cover', 'url alt thumbnailUrl')
        .exec(),
      this.galleryModel.countDocuments(filter),
    ]);
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findOne(id: string): Promise<GalleryDocument> {
    const album = await this.galleryModel
      .findById(id)
      .populate('cover', 'url alt thumbnailUrl')
      .populate('photos', 'url alt thumbnailUrl title')
      .exec();
    if (!album) throw new NotFoundException('Gallery album not found');
    return album;
  }

  async findOneBySlug(slug: string): Promise<GalleryDocument> {
    const album = await this.galleryModel
      .findOne({ slug, status: 'published' })
      .populate('cover', 'url alt thumbnailUrl')
      .populate('photos', 'url alt thumbnailUrl title')
      .exec();
    if (!album) throw new NotFoundException('Gallery album not found');
    return album;
  }

  async create(dto: CreateGalleryDto, user: UserDocument): Promise<GalleryDocument> {
    const exists = await this.galleryModel.findOne({ slug: dto.slug }).exec();
    if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);

    const album = new this.galleryModel({
      ...dto,
      createdBy: (user._id as unknown as string).toString(),
    });
    await album.save();

    this.eventEmitter.emit('audit.log', {
      action: 'CREATE', entity: 'Gallery', entityId: (album._id as unknown as string).toString(),
      after: album.toObject(), performedBy: (user._id as unknown as string).toString(),
    });
    return album;
  }

  async update(id: string, dto: UpdateGalleryDto, user: UserDocument): Promise<GalleryDocument> {
    if (dto.slug) {
      const exists = await this.galleryModel.findOne({ slug: dto.slug, _id: { $ne: id } }).exec();
      if (exists) throw new ConflictException(`Slug "${dto.slug}" already exists`);
    }
    const before = await this.findOne(id);
    const album = await this.galleryModel.findByIdAndUpdate(id, dto, { new: true }).exec();
    if (!album) throw new NotFoundException('Gallery album not found');

    this.eventEmitter.emit('audit.log', {
      action: 'UPDATE', entity: 'Gallery', entityId: id,
      before: before.toObject(), after: album.toObject(), performedBy: (user._id as unknown as string).toString(),
    });
    return album;
  }

  async updateStatus(id: string, dto: UpdateGalleryStatusDto, user: UserDocument): Promise<GalleryDocument> {
    const album = await this.findOne(id);
    album.status = dto.status;
    await album.save();

    this.eventEmitter.emit('audit.log', {
      action: 'STATUS_CHANGE', entity: 'Gallery', entityId: id,
      meta: { to: dto.status }, performedBy: (user._id as unknown as string).toString(),
    });
    return album;
  }

  async addPhotos(id: string, dto: AddPhotosDto, user: UserDocument): Promise<GalleryDocument> {
    const album = await this.galleryModel
      .findByIdAndUpdate(
        id,
        { $addToSet: { photos: { $each: dto.photoIds } } },
        { new: true },
      )
      .exec();
    if (!album) throw new NotFoundException('Gallery album not found');

    this.eventEmitter.emit('audit.log', {
      action: 'ADD_PHOTOS', entity: 'Gallery', entityId: id,
      meta: { count: dto.photoIds.length }, performedBy: (user._id as unknown as string).toString(),
    });
    return album;
  }

  async removePhoto(id: string, photoId: string, user: UserDocument): Promise<GalleryDocument> {
    const album = await this.galleryModel
      .findByIdAndUpdate(id, { $pull: { photos: photoId } }, { new: true })
      .exec();
    if (!album) throw new NotFoundException('Gallery album not found');

    this.eventEmitter.emit('audit.log', {
      action: 'REMOVE_PHOTO', entity: 'Gallery', entityId: id,
      meta: { photoId }, performedBy: (user._id as unknown as string).toString(),
    });
    return album;
  }

  async remove(id: string, user: UserDocument): Promise<void> {
    const album = await this.findOne(id);
    await this.galleryModel.findByIdAndDelete(id).exec();
    this.eventEmitter.emit('audit.log', {
      action: 'DELETE', entity: 'Gallery', entityId: id,
      before: album.toObject(), performedBy: (user._id as unknown as string).toString(),
    });
  }

  async getAllTags(): Promise<string[]> {
    const result = await this.galleryModel.distinct('tags', { status: 'published' }).exec();
    return result as string[];
  }
}
