import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Meeting, MeetingDocument } from '../schemas/meeting.schema';
import { CreateMeetingDto, UpdateMeetingDto, QueryMeetingDto } from './dto/meeting.dto';

@Injectable()
export class MeetingsService {
  constructor(
    @InjectModel(Meeting.name) private meetingModel: Model<MeetingDocument>,
  ) {}

  async findAll(query: QueryMeetingDto) {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (query.department) filter.department = new Types.ObjectId(query.department);
    if (query.cabinetPeriod) filter.cabinetPeriod = new Types.ObjectId(query.cabinetPeriod);

    const data = await this.meetingModel
      .find(filter)
      .populate('department', 'name')
      .populate('attendees', 'name avatar')
      .sort({ date: -1 })
      .exec();
    
    return { data };
  }

  async findById(id: string) {
    const meeting = await this.meetingModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('department', 'name')
      .populate('attendees', 'name email avatar')
      .populate('attachments', 'url title')
      .populate('actionItems', 'title status deadline')
      .exec();
    if (!meeting) throw new NotFoundException('Meeting not found');
    return meeting;
  }

  async create(dto: CreateMeetingDto) {
    const meeting = await this.meetingModel.create({
      ...dto,
      cabinetPeriod: new Types.ObjectId(dto.cabinetPeriod),
      department: new Types.ObjectId(dto.department),
      date: new Date(dto.date),
      attendees: dto.attendees?.map(id => new Types.ObjectId(id)) || [],
      attachments: dto.attachments?.map(id => new Types.ObjectId(id)) || [],
      actionItems: dto.actionItems?.map(id => new Types.ObjectId(id)) || [],
    });
    return meeting;
  }

  async update(id: string, dto: UpdateMeetingDto) {
    const meeting = await this.findById(id);

    if (dto.attendees) meeting.attendees = dto.attendees.map(a => new Types.ObjectId(a)) as any;
    if (dto.attachments) meeting.attachments = dto.attachments.map(a => new Types.ObjectId(a)) as any;
    if (dto.actionItems) meeting.actionItems = dto.actionItems.map(a => new Types.ObjectId(a)) as any;

    Object.assign(meeting, {
      ...dto,
      attendees: meeting.attendees,
      attachments: meeting.attachments,
      actionItems: meeting.actionItems,
      date: dto.date ? new Date(dto.date) : meeting.date,
    });

    return meeting.save();
  }

  async delete(id: string) {
    const meeting = await this.findById(id);
    meeting.deletedAt = new Date();
    await meeting.save();
    return { deleted: true };
  }
}
