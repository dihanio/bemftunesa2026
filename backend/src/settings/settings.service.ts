import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from '../schemas/setting.schema';
import { UpdateSettingDto } from './dto/setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name) private settingModel: Model<SettingDocument>,
  ) {}

  async findByKey(key: string): Promise<Setting | null> {
    return this.settingModel.findOne({ key }).lean().exec();
  }

  async findMany(keys: string[]): Promise<Setting[]> {
    return this.settingModel.find({ key: { $in: keys } }).lean().exec();
  }

  async getAll(): Promise<Setting[]> {
    return this.settingModel.find().sort({ key: 1 }).lean().exec();
  }

  async upsert(key: string, value: any, type?: string, description?: string): Promise<Setting> {
    const updateData: any = { value };
    if (type !== undefined) updateData.type = type;
    if (description !== undefined) updateData.description = description;

    const setting = await this.settingModel.findOneAndUpdate(
      { key },
      { $set: updateData },
      { new: true, upsert: true }
    ).exec();

    return setting;
  }

  async bulkUpsert(settings: UpdateSettingDto[]): Promise<any> {
    const operations = settings.map((s) => {
      const updateData: any = { value: s.value };
      if (s.type !== undefined) updateData.type = s.type;
      if (s.description !== undefined) updateData.description = s.description;

      return {
        updateOne: {
          filter: { key: s.key },
          update: { $set: updateData },
          upsert: true,
        },
      };
    });

    if (operations.length > 0) {
      return this.settingModel.bulkWrite(operations);
    }
    return { modifiedCount: 0, upsertedCount: 0 };
  }
}
