import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Model, Types } from 'mongoose';
import { Event as EventModel, EventDocument } from '../schemas/event.schema';
import {
  CreateEventDto,
  UpdateEventDto,
  UpdateEventStatusDto,
  EventQueryDto,
} from './dto/event.dto';
import {
  buildPaginateQuery,
  buildPaginateResponse,
} from '../common/dto/pagination.dto';
import type { UserDocument } from '../schemas/user.schema';

const toStr = (id: unknown): string => (id as { toString(): string }).toString();

@Injectable()
export class EventsService {
  constructor(
    @InjectModel(EventModel.name)
    private eventModel: Model<EventDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: EventQueryDto) {
    const { skip, limit, sortObj } = buildPaginateQuery(query);
    const filter: Record<string, unknown> = {};

    if (query.status) filter.status = query.status;
    if (query.tag) filter.tags = query.tag;
    if (query.search) {
      filter.$or = [
        { title: { $regex: query.search, $options: 'i' } },
        { description: { $regex: query.search, $options: 'i' } },
        { location: { $regex: query.search, $options: 'i' } },
      ];
    }
    if (query.from || query.to) {
      filter.startDate = {};
      if (query.from) (filter.startDate as Record<string, unknown>).$gte = new Date(query.from);
      if (query.to) (filter.startDate as Record<string, unknown>).$lte = new Date(query.to);
    }

    const [data, total] = await Promise.all([
      this.eventModel
        .find(filter)
        .populate('author', 'name email')
        .populate('poster', 'url alt filename')
        .sort(sortObj)
        .skip(skip)
        .limit(limit)
        .exec(),
      this.eventModel.countDocuments(filter).exec(),
    ]);

    return buildPaginateResponse(data, total, query);
  }

  async findById(id: string) {
    const event = await this.eventModel
      .findById(id)
      .populate('author', 'name email')
      .populate('poster', 'url alt filename thumbnail')
      .populate('gallery', 'url alt filename thumbnail')
      .exec();
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async findBySlug(slug: string) {
    const event = await this.eventModel
      .findOne({ slug })
      .populate('author', 'name email')
      .populate('poster', 'url alt filename thumbnail')
      .populate('gallery', 'url alt filename thumbnail')
      .exec();
    if (!event) throw new NotFoundException('Event not found');
    return event;
  }

  async create(dto: CreateEventDto, author: UserDocument) {
    const existing = await this.eventModel.findOne({ slug: dto.slug }).exec();
    if (existing) throw new BadRequestException('Event slug already exists');

    const toObjectId = (id: string | undefined) =>
      id ? new Types.ObjectId(id) : undefined;

    const event = await this.eventModel.create({
      ...dto,
      status: dto.status ?? 'draft',
      author: author._id,
      poster: toObjectId(dto.poster),
      gallery: dto.gallery?.map((g) => new Types.ObjectId(g)) ?? [],
    });

    this.eventEmitter.emit('content.created', {
      user: toStr(author._id),
      userName: author.name,
      entity: 'event',
      entityId: toStr(event._id),
      summary: `Created event: "${event.title}"`,
    });

    return event;
  }

  async update(id: string, dto: UpdateEventDto, user: UserDocument) {
    const event = await this.eventModel.findById(id).exec();
    if (!event) throw new NotFoundException('Event not found');

    const before = event.toObject();
    const toObjectId = (id: string | undefined) =>
      id ? new Types.ObjectId(id) : undefined;

    Object.assign(event, {
      ...dto,
      poster: dto.poster ? toObjectId(dto.poster) : event.poster,
      gallery: dto.gallery
        ? dto.gallery.map((g) => new Types.ObjectId(g))
        : event.gallery,
    });

    const saved = await event.save();

    this.eventEmitter.emit('content.updated', {
      user: toStr(user._id),
      userName: user.name,
      entity: 'event',
      entityId: id,
      summary: `Updated event: "${event.title}"`,
      changes: { before, after: saved.toObject() },
    });

    return saved;
  }

  async updateStatus(id: string, dto: UpdateEventStatusDto, user: UserDocument) {
    const event = await this.eventModel.findById(id).exec();
    if (!event) throw new NotFoundException('Event not found');

    const oldStatus = event.status;
    event.status = dto.status;
    if (dto.status === 'published' && !event.publishedAt) {
      event.publishedAt = new Date();
    }

    const saved = await event.save();

    const action = dto.status === 'published' ? 'publish'
      : dto.status === 'archived' ? 'archive'
      : 'update';

    this.eventEmitter.emit(`content.${action}`, {
      user: toStr(user._id),
      userName: user.name,
      entity: 'event',
      entityId: id,
      summary: `Event "${event.title}" status changed: "${oldStatus}" → "${dto.status}"`,
    });

    return saved;
  }

  async delete(id: string, user: UserDocument) {
    const event = await this.eventModel.findById(id).exec();
    if (!event) throw new NotFoundException('Event not found');

    await event.deleteOne();

    this.eventEmitter.emit('content.deleted', {
      user: toStr(user._id),
      userName: user.name,
      entity: 'event',
      entityId: id,
      summary: `Deleted event: "${event.title}"`,
    });

    return { deleted: true };
  }
}
