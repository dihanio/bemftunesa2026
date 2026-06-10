import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Committee } from '../../database/schema/proker';

@Injectable()
export class CommitteesService {
  constructor(
    @InjectModel(Committee.name) private committeeModel: Model<Committee>,
  ) {}

  async getUserCommittees(userId: string) {
    const committees = await this.committeeModel
      .find({ userId, deletedAt: null })
      .populate('prokerId', 'title status');
    return { data: committees };
  }

  async getProkerCommittees(prokerId: string) {
    const committees = await this.committeeModel
      .find({ prokerId, deletedAt: null })
      .populate('userId', 'name avatar role');
    return { data: committees };
  }

  async getOverview() {
    const overview = await this.committeeModel.aggregate([
      { $match: { deletedAt: null } },
      { $group: { _id: '$userId', totalCommittees: { $sum: 1 } } },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'user',
        },
      },
      { $unwind: '$user' },
      {
        $project: {
          _id: 1,
          totalCommittees: 1,
          'user.name': 1,
          'user.avatar': 1,
          'user.departmentId': 1,
        },
      },
      { $sort: { totalCommittees: -1 } },
    ]);
    return { data: overview };
  }
}
