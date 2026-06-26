import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { DepartmentDocument } from '../schemas/department.schema';
import { UserDocument } from '../schemas/user.schema';
import { ProgramDocument } from '../schemas/program.schema';
import { TaskDocument } from '../schemas/task.schema';
import { AspirationDocument } from '../schemas/aspiration.schema';

@Injectable()
export class DashboardService {
  constructor(
    @InjectModel('Department') private departmentModel: Model<DepartmentDocument>,
    @InjectModel('User') private userModel: Model<UserDocument>,
    @InjectModel('Program') private programModel: Model<ProgramDocument>,
    @InjectModel('Task') private taskModel: Model<TaskDocument>,
    @InjectModel('Aspiration') private aspirationModel: Model<AspirationDocument>,
  ) {}

  async getMetrics(cabinetPeriodId?: string) {
    const filter: any = {};
    if (cabinetPeriodId) {
      filter.cabinetPeriod = new Types.ObjectId(cabinetPeriodId);
    }
    
    // We only count active members based on role? Or just non-deleted.
    const deptFilter = cabinetPeriodId ? { cabinetPeriod: new Types.ObjectId(cabinetPeriodId), deletedAt: { $exists: false } } : { deletedAt: { $exists: false } };
    const userFilter = cabinetPeriodId ? { 'cabinetPeriods.period': new Types.ObjectId(cabinetPeriodId), isActive: true, deletedAt: { $exists: false } } : { isActive: true, deletedAt: { $exists: false } };
    
    const [
      departmentsCount,
      membersCount,
      programsTotal,
      programsCompleted,
      tasksActive,
      aspirationsTotal,
      aspirationsPending,
      aspirationsResolved
    ] = await Promise.all([
      this.departmentModel.countDocuments(deptFilter),
      this.userModel.countDocuments(userFilter),
      this.programModel.countDocuments({ ...filter, deletedAt: { $exists: false } }),
      this.programModel.countDocuments({ ...filter, status: 'completed', deletedAt: { $exists: false } }),
      this.taskModel.countDocuments({ ...filter, status: { $in: ['todo', 'in_progress', 'review'] }, deletedAt: { $exists: false } }),
      this.aspirationModel.countDocuments({ ...filter, deletedAt: { $exists: false } }),
      this.aspirationModel.countDocuments({ ...filter, status: { $in: ['new', 'processing', 'pending'] }, deletedAt: { $exists: false } }),
      this.aspirationModel.countDocuments({ ...filter, status: 'resolved', deletedAt: { $exists: false } })
    ]);
    
    const overall_progress = programsTotal > 0 ? Math.round((programsCompleted / programsTotal) * 100) : 0;

    return {
      total_departments: departmentsCount,
      total_members: membersCount,
      total_proker: programsTotal,
      aspirations: { total: aspirationsTotal, pending: aspirationsPending, resolved: aspirationsResolved },
      overall_progress: `+${overall_progress}%`,
      active_tasks: tasksActive.toString(),
      avg_approval_time: "24 hrs" // Placeholder
    };
  }
}
