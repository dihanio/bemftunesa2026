import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Point } from '../../database/schema/ims';
import { User } from '../../database/schema/users';

@Injectable()
export class PointsService {
  constructor(
    @InjectModel(Point.name) private pointModel: Model<Point>,
    @InjectModel(User.name) private userModel: Model<User>,
  ) {}

  async getLeaderboard() {
    const leaderboard = await this.userModel
      .find({ role: { $nin: ['Guest'] }, isActive: true, deletedAt: null })
      .sort({ points: -1 })
      .limit(50)
      .select('name avatar role departmentId points')
      .populate<{ departmentId: { name: string } }>(
        'departmentId',
        'name code',
      );

    const mappedLeaderboard = leaderboard.map((l) => ({
      userId: l._id.toString(),
      userName: l.name,
      department: l.departmentId ? l.departmentId.name : 'BPI',
      totalPoints: (l as any).points || 0,
    }));

    return { data: mappedLeaderboard };
  }

  async getAllPoints(limit: number = 100) {
    const history = await this.pointModel
      .find()
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate('awardedBy', 'name');

    const mapped = history.map((p: any) => ({
      _id: p._id.toString(),
      userId: p.userId.toString(),
      points: p.amount,
      type: p.category || p.type,
      description: p.reason,
      createdAt: p.createdAt,
    }));
    return { data: mapped };
  }

  async getUserPoints(userId: string) {
    const history = await this.pointModel
      .find({ userId })
      .sort({ createdAt: -1 })
      .populate('awardedBy', 'name');

    const total = history.reduce(
      (sum, p) => sum + (p.type === 'EARN' ? p.amount : -p.amount),
      0,
    );

    const mappedHistory = history.map((p: any) => ({
      _id: p._id.toString(),
      userId: p.userId.toString(),
      points: p.amount,
      type: p.category || p.type,
      description: p.reason,
      createdAt: p.createdAt,
    }));

    return { data: { total, history: mappedHistory } };
  }

  async awardPoints(data: any, awardedBy: string) {
    const point = await this.pointModel.create({ ...data, awardedBy });
    // Update user's total points
    const increment = data.type === 'EARN' ? data.amount : -data.amount;
    await this.userModel.findByIdAndUpdate(data.userId, {
      $inc: { points: increment },
    });
    return { data: point, message: 'Poin berhasil diperbarui' };
  }
}
