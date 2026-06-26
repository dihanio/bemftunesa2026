import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserDocument } from '../schemas/user.schema';
import { DepartmentDocument } from '../schemas/department.schema';
import { ProgramDocument } from '../schemas/program.schema';
import { TaskDocument } from '../schemas/task.schema';
import { DocumentDocument } from '../schemas/document.schema';
import { MeetingDocument } from '../schemas/meeting.schema';

@Injectable()
export class RecycleBinService {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Department') private departmentModel: Model<DepartmentDocument>,
    @InjectModel('Program') private programModel: Model<ProgramDocument>,
    @InjectModel('Task') private taskModel: Model<TaskDocument>,
    @InjectModel('Document') private documentModel: Model<DocumentDocument>,
    @InjectModel('Meeting') private meetingModel: Model<MeetingDocument>,
  ) {}

  private getModel(collection: string): Model<any> {
    switch (collection) {
      case 'users': return this.userModel;
      case 'departments': return this.departmentModel;
      case 'programs': return this.programModel;
      case 'tasks': return this.taskModel;
      case 'documents': return this.documentModel;
      case 'meetings': return this.meetingModel;
      default: throw new NotFoundException('Collection not found');
    }
  }

  async getDeletedItems() {
    const filter = { deletedAt: { $exists: true, $ne: null } };
    
    const [users, departments, programs, tasks, documents, meetings] = await Promise.all([
      this.userModel.find(filter).select('name email deletedAt _id').lean(),
      this.departmentModel.find(filter).select('name deletedAt _id').lean(),
      this.programModel.find(filter).select('name deletedAt _id').lean(),
      this.taskModel.find(filter).select('title deletedAt _id').lean(),
      this.documentModel.find(filter).select('title deletedAt _id').lean(),
      this.meetingModel.find(filter).select('title deletedAt _id').lean()
    ]);

    const results: any[] = [];
    users.forEach(i => results.push({ id: i._id, title: i.name, type: 'users', deletedAt: i.deletedAt }));
    departments.forEach(i => results.push({ id: i._id, title: i.name, type: 'departments', deletedAt: i.deletedAt }));
    programs.forEach(i => results.push({ id: i._id, title: i.title, type: 'programs', deletedAt: i.deletedAt }));
    tasks.forEach(i => results.push({ id: i._id, title: i.title, type: 'tasks', deletedAt: i.deletedAt }));
    documents.forEach(i => results.push({ id: i._id, title: i.title, type: 'documents', deletedAt: i.deletedAt }));
    meetings.forEach(i => results.push({ id: i._id, title: i.title, type: 'meetings', deletedAt: i.deletedAt }));

    // Sort by most recently deleted first
    return results.sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  }

  async restoreItem(collection: string, id: string) {
    const model = this.getModel(collection);
    const item = await model.findByIdAndUpdate(id, { $unset: { deletedAt: 1 } }, { new: true });
    if (!item) throw new NotFoundException('Item not found');
    return item;
  }
}
