import { Controller, Get, Put, Post, Body, Param, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateSettingDto, BulkUpdateSettingsDto } from './dto/setting.dto';

@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  // PUBLIC ENDPOINTS

  @Get('public/about')
  async getPublicAbout() {
    const keys = [
      'about_tagline',
      'about_visi',
      'about_misi',
      'about_tujuan_title',
      'about_tujuan_desc',
      'about_filosofi'
    ];
    
    const settings = await this.settingsService.findMany(keys);
    
    const data: Record<string, any> = {};
    settings.forEach(s => {
      data[s.key] = s.value;
    });

    return {
      success: true,
      data
    };
  }

  @Get('public/sambutan')
  async getPublicSambutan() {
    const keys = ['sambutan_text', 'sambutan_intro'];
    const settings = await this.settingsService.findMany(keys);
    
    const data: Record<string, any> = {};
    settings.forEach(s => {
      data[s.key] = s.value;
    });

    return {
      success: true,
      data
    };
  }

  // CMS ENDPOINTS
  
  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllSettings() {
    const data = await this.settingsService.getAll();
    return {
      success: true,
      data
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':key')
  async updateSetting(
    @Param('key') key: string,
    @Body() updateDto: UpdateSettingDto
  ) {
    const updated = await this.settingsService.upsert(
      key, 
      updateDto.value, 
      updateDto.type, 
      updateDto.description
    );
    return {
      success: true,
      data: updated
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk')
  async bulkUpdateSettings(@Body() bulkDto: BulkUpdateSettingsDto) {
    const result = await this.settingsService.bulkUpsert(bulkDto.settings);
    return {
      success: true,
      message: 'Settings updated successfully',
      data: result
    };
  }
}
