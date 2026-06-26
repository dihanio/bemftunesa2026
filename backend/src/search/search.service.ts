import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { UserDocument } from '../schemas/user.schema';
import { DepartmentDocument } from '../schemas/department.schema';
import { ProgramDocument } from '../schemas/program.schema';
import { TaskDocument } from '../schemas/task.schema';
import { DocumentDocument } from '../schemas/document.schema';
import { MeetingDocument } from '../schemas/meeting.schema';
import { AspirationDocument } from '../schemas/aspiration.schema';

@Injectable()
export class SearchService {
  constructor(
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Department') private departmentModel: Model<DepartmentDocument>,
    @InjectModel('Program') private programModel: Model<ProgramDocument>,
    @InjectModel('Task') private taskModel: Model<TaskDocument>,
    @InjectModel('Document') private documentModel: Model<DocumentDocument>,
    @InjectModel('Meeting') private meetingModel: Model<MeetingDocument>,
    @InjectModel('Aspiration') private aspirationModel: Model<AspirationDocument>,
  ) {}

  async globalSearch(query: string, cabinetPeriodId?: string) {
    if (!query || query.trim().length < 2) {
      return [];
    }

    const regex = new RegExp(query, 'i');
    
    // Filter base
    const filter: any = { deletedAt: { $exists: false } };
    if (cabinetPeriodId) {
      filter.cabinetPeriod = new Types.ObjectId(cabinetPeriodId);
    }

    // Parallel search across collections
    const [
      users,
      departments,
      programs,
      tasks,
      documents,
      meetings,
      aspirations
    ] = await Promise.all([
      // Users
      this.userModel.find({
        $or: [{ name: regex }, { email: regex }, { nim: regex }],
        deletedAt: { $exists: false },
        ...(cabinetPeriodId ? { 'cabinetPeriods.period': new Types.ObjectId(cabinetPeriodId) } : {})
      }).limit(5).select('name email _id avatar'),
      
      // Departments
      this.departmentModel.find({
        name: regex,
        deletedAt: { $exists: false },
        ...(cabinetPeriodId ? { cabinetPeriod: new Types.ObjectId(cabinetPeriodId) } : {})
      }).limit(5).select('name _id'),
      
      // Programs
      this.programModel.find({
        title: regex,
        ...filter
      }).limit(5).select('title _id status'),
      
      // Tasks
      this.taskModel.find({
        title: regex,
        ...filter
      }).limit(5).select('title _id status priority'),
      
      // Documents
      this.documentModel.find({
        title: regex,
        ...filter
      }).limit(5).select('title _id type'),
      
      // Meetings
      this.meetingModel.find({
        title: regex,
        ...filter
      }).limit(5).select('title _id date'),
      
      // Aspirations
      this.aspirationModel.find({
        title: regex,
        ...filter
      }).limit(5).select('title _id status type')
    ]);

    const results: any[] = [];

    // Map to a generic search result format
    users.forEach(u => results.push({ id: u._id, title: u.name, subtitle: u.email, type: 'Pengguna', link: `/cms/users` }));
    departments.forEach(d => results.push({ id: d._id, title: d.name, type: 'Departemen', link: `/cms/departments` }));
    programs.forEach(p => results.push({ id: p._id, title: p.title, subtitle: `Status: ${p.status}`, type: 'Program Kerja', link: `/cms/programs` }));
    tasks.forEach(t => results.push({ id: t._id, title: t.title, subtitle: `Prioritas: ${t.priority}`, type: 'Tugas', link: `/cms/tasks` }));
    documents.forEach(d => results.push({ id: d._id, title: d.title, subtitle: `Tipe: ${d.type}`, type: 'Dokumen', link: `/cms/documents` }));
    meetings.forEach(m => results.push({ id: m._id, title: m.title, type: 'Rapat', link: `/cms/meetings` }));
    aspirations.forEach(a => results.push({ id: a._id, title: a.title, subtitle: `Status: ${a.status}`, type: 'Aspirasi', link: `/cms/aspirations` }));

    return results;
  }
}
