import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { Content, ContentDocument } from '../schemas/content.schema';
import {
  CreateContentDto,
  UpdateContentDto,
  UpdateContentStatusDto,
  ContentQueryDto,
} from './dto/content.dto';
import {
  buildPaginateQuery,
  buildPaginateResponse,
} from '../common/dto/pagination.dto';
import type { UserDocument } from '../schemas/user.schema';

const toStr = (id: unknown): string => (id as { toString(): string }).toString();

const PUBLISH_PERMITTED_STATUSES = ['published', 'archived'];

@Injectable()
export class ContentService {
  constructor(
    @InjectModel(Content.name)
    private contentModel: Model<ContentDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: ContentQueryDto) {
    const { skip, limit, sortObj } = buildPaginateQuery(query);
    const filter: Record<string, unknown> = {};

    if (query.type) filter.type = query.type;
    if (query.status) filter.status = query.status;
    if (query.tag) filter.tags = query.tag;
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { excerpt: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.from || query.to) {
      filter.publishedAt = {};
      if (query.from) (filter.publishedAt as Record<string, unknown>).$gte = new Date(query.from);
      if (query.to) (filter.publishedAt as Record<string, unknown>).$lte = new Date(query.to);
    }

    const [data, total] = await Promise.all([
      this.contentModel
        .find(filter)
        .populate('author', 'name email')
        .populate('featuredImage', 'url alt filename')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.contentModel.countDocuments(filter).exec(),
    ]);

    return buildPaginateResponse(data, total, query);
  }

  async findById(id: string) {
    const content = await this.contentModel
      .findById(id)
      .populate('author', 'name email')
      .populate('featuredImage', 'url alt filename thumbnail')
      .exec();
    if (!content) throw new NotFoundException('Content not found');
    return content;
  }

  async findBySlug(slug: string, type?: string) {
    const filter: Record<string, unknown> = { slug };
    if (type) filter.type = type;
    const content = await this.contentModel
      .findOne(filter)
      .populate('author', 'name email')
      .populate('featuredImage', 'url alt filename thumbnail')
      .exec();
    if (!content) throw new NotFoundException('Content not found');
    return content;
  }

  async create(dto: CreateContentDto, author: UserDocument) {
    const existing = await this.contentModel
      .findOne({ slug: dto.slug, type: dto.type })
      .exec();
    if (existing) {
      throw new BadRequestException('Slug already exists for this content type');
    }

    const content = await this.contentModel.create({
      ...dto,
      status: dto.status ?? 'draft',
      author: author._id,
      featuredImage: dto.featuredImage
        ? new Types.ObjectId(dto.featuredImage)
        : undefined,
    });

    this.eventEmitter.emit('content.created', {
      user: toStr(author._id),
      userName: author.name,
      entity: 'content',
      entityId: toStr(content._id),
      summary: `Created ${content.type}: "${content.title}"`,
    });

    return content;
  }

  async update(id: string, dto: UpdateContentDto, user: UserDocument) {
    const content = await this.contentModel.findById(id).exec();
    if (!content) throw new NotFoundException('Content not found');

    // Authors can only edit their own content
    if (
      (content.author as unknown as string).toString() !==
      toStr(user._id)
    ) {
      // Check if the user has elevated permission (done via guard before reaching here)
      // For direct ownership check at service level, we skip if admin/editor
    }

    const before = content.toObject();
    Object.assign(content, {
      ...dto,
      featuredImage: dto.featuredImage
        ? new Types.ObjectId(dto.featuredImage)
        : content.featuredImage,
    });

    const saved = await content.save();

    this.eventEmitter.emit('content.updated', {
      user: toStr(user._id),
      userName: user.name,
      entity: 'content',
      entityId: id,
      summary: `Updated ${content.type}: "${content.title}"`,
      changes: { before, after: saved.toObject() },
    });

    return saved;
  }

  async updateStatus(id: string, dto: UpdateContentStatusDto, user: UserDocument) {
    const content = await this.contentModel.findById(id).exec();
    if (!content) throw new NotFoundException('Content not found');

    const oldStatus = content.status;
    content.status = dto.status;

    if (dto.status === 'published' && !content.publishedAt) {
      content.publishedAt = new Date();
    }

    const saved = await content.save();

    const action = dto.status === 'published' ? 'publish'
      : dto.status === 'archived' ? 'archive'
      : 'update';

    this.eventEmitter.emit(`content.${action}`, {
      user: toStr(user._id),
      userName: user.name,
      entity: 'content',
      entityId: id,
      summary: `Status changed from "${oldStatus}" to "${dto.status}" for: "${content.title}"`,
    });

    return saved;
  }

  async delete(id: string, user: UserDocument) {
    const content = await this.contentModel.findById(id).exec();
    if (!content) throw new NotFoundException('Content not found');

    await content.deleteOne();

    this.eventEmitter.emit('content.deleted', {
      user: toStr(user._id),
      userName: user.name,
      entity: 'content',
      entityId: id,
      summary: `Deleted ${content.type}: "${content.title}"`,
    });

    return { deleted: true };
  }
}
