import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Task, TaskDocument } from '../schemas/task.schema';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';

@Injectable()
export class TasksService {
  constructor(
    @InjectModel(Task.name) private taskModel: Model<TaskDocument>,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(query: QueryTaskDto) {
    const filter: Record<string, unknown> = { deletedAt: { $exists: false } };
    if (query.department) filter.department = new Types.ObjectId(query.department);
    if (query.status) filter.status = query.status;
    if (query.cabinetPeriod) filter.cabinetPeriod = new Types.ObjectId(query.cabinetPeriod);
    if (query.program) filter.program = new Types.ObjectId(query.program);
    if (query.assignee) filter.assignees = { $in: [new Types.ObjectId(query.assignee)] };

    const data = await this.taskModel
      .find(filter)
      .populate('assignees', 'name email avatar')
      .populate('creator', 'name')
      .populate('department', 'name')
      .sort({ createdAt: -1 })
      .exec();
    
    return { data };
  }

  async findById(id: string) {
    const task = await this.taskModel
      .findOne({ _id: id, deletedAt: { $exists: false } })
      .populate('assignees', 'name email avatar')
      .populate('creator', 'name email')
      .populate('program', 'title')
      .exec();
    if (!task) throw new NotFoundException('Task not found');
    return task;
  }

  async create(dto: CreateTaskDto, creatorId: string) {
    const task = await this.taskModel.create({
      ...dto,
      cabinetPeriod: new Types.ObjectId(dto.cabinetPeriod),
      department: new Types.ObjectId(dto.department),
      program: dto.program ? new Types.ObjectId(dto.program) : undefined,
      assignees: dto.assignees?.map(id => new Types.ObjectId(id)) || [],
      creator: new Types.ObjectId(creatorId),
      deadline: dto.deadline ? new Date(dto.deadline) : undefined,
    });

    if (dto.assignees && dto.assignees.length > 0) {
      dto.assignees.forEach(assigneeId => {
        this.eventEmitter.emit('task.assigned', {
          taskId: task._id.toString(),
          assigneeId,
          title: task.title,
        });
      });
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto) {
    const task = await this.findById(id);

    if (dto.assignees) {
      task.assignees = dto.assignees.map(a => new Types.ObjectId(a)) as any;
    }

    Object.assign(task, {
      ...dto,
      assignees: task.assignees,
      deadline: dto.deadline ? new Date(dto.deadline) : task.deadline,
    });

    return task.save();
  }

  async delete(id: string) {
    const task = await this.findById(id);
    task.deletedAt = new Date();
    await task.save();
    return { deleted: true };
  }
}
