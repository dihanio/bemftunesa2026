import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Setting, SettingDocument } from '../schemas/setting.schema';
import { HomepageSection, HomepageSectionDocument } from '../schemas/homepage-section.schema';
import { UpsertSettingDto, UpdateHomepageDto } from './dto/settings.dto';

@Injectable()
export class SettingsService {
  constructor(
    @InjectModel(Setting.name)
    private settingModel: Model<SettingDocument>,
    @InjectModel(HomepageSection.name)
    private homepageModel: Model<HomepageSectionDocument>,
  ) {}

  // =================== Global Settings ===================

  async findAll(group?: string) {
    const filter: Record<string, unknown> = {};
    if (group) filter.group = group;
    return this.settingModel.find(filter).sort({ key: 1 }).exec();
  }

  async findByKey(key: string) {
    const setting = await this.settingModel.findOne({ key }).exec();
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    return setting;
  }

  async upsert(dto: UpsertSettingDto) {
    return this.settingModel
      .findOneAndUpdate(
        { key: dto.key },
        { $set: dto },
        { upsert: true, new: true },
      )
      .exec();
  }

  async upsertMany(settings: UpsertSettingDto[]) {
    const results = await Promise.all(settings.map((s) => this.upsert(s)));
    return results;
  }

  async delete(key: string) {
    const setting = await this.settingModel.findOne({ key }).exec();
    if (!setting) throw new NotFoundException(`Setting "${key}" not found`);
    await setting.deleteOne();
    return { deleted: true };
  }

  // =================== Homepage Builder ===================

  async getHomepage() {
    return this.homepageModel.find().sort({ order: 1 }).exec();
  }

  async updateHomepage(dto: UpdateHomepageDto) {
    // Replace all sections by deleting and re-inserting in correct order
    await this.homepageModel.deleteMany({}).exec();

    const sections = dto.sections.map((section, index) => ({
      ...section,
      order: section.order ?? index,
    }));

    return this.homepageModel.insertMany(sections);
  }

  async toggleHomepageSection(sectionId: string, isActive: boolean) {
    const section = await this.homepageModel.findById(sectionId).exec();
    if (!section) throw new NotFoundException('Homepage section not found');
    section.isActive = isActive;
    return section.save();
  }
}
