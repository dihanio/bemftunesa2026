import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SettingsService } from './settings.service';
import { SettingsController } from './settings.controller';
import { Setting, SettingSchema } from '../schemas/setting.schema';
import { HomepageSection, HomepageSectionSchema } from '../schemas/homepage-section.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Setting.name, schema: SettingSchema },
      { name: HomepageSection.name, schema: HomepageSectionSchema },
    ]),
  ],
  controllers: [SettingsController],
  providers: [SettingsService],
  exports: [SettingsService],
})
export class SettingsModule {}
