import {
  Controller,
  Get,
  Put,
  Post,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { PkkmbPermission } from '../common/auth/pkkmb-permissions';
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
      'about_filosofi',
    ];

    const settings = await this.settingsService.findMany(keys);

    const data: Record<string, unknown> = {};
    settings.forEach((s) => {
      data[s.key] = s.value;
    });

    return {
      success: true,
      data,
    };
  }

  @Get('public/sambutan')
  async getPublicSambutan() {
    const keys = ['sambutan_text', 'sambutan_intro'];
    const settings = await this.settingsService.findMany(keys);

    const data: Record<string, unknown> = {};
    settings.forEach((s) => {
      data[s.key] = s.value;
    });

    return {
      success: true,
      data,
    };
  }

  @Get('public/links')
  async getPublicLinks() {
    const keys = [
      'pkkmb_buku_panduan_url',
      'pkkmb_pusat_bantuan_url',
      'pkkmb_twibbon_url',
    ];
    const settings = await this.settingsService.findMany(keys);

    const data: Record<string, string> = {
      pkkmb_buku_panduan_url: '#',
      pkkmb_pusat_bantuan_url: '#',
      pkkmb_twibbon_url: '#',
    };

    settings.forEach((s) => {
      if (s.value) data[s.key] = s.value as string;
    });

    return {
      success: true,
      data,
    };
  }

  // MAINTENANCE MODE

  @Get('public/maintenance')
  async getPublicMaintenance() {
    const setting = await this.settingsService.findByKey('maintenance_mode');
    const value = (setting?.value ?? {}) as {
      enabled?: boolean;
      message?: string;
    };
    return {
      success: true,
      data: {
        enabled: value.enabled === true,
        message: value.message || '',
      },
    };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions(PkkmbPermission.SETTINGS_MANAGE)
  @Put('admin/maintenance')
  async updateMaintenance(
    @Body() body: { enabled: boolean; message?: string },
  ) {
    const value = {
      enabled: body.enabled === true,
      message: body.message || '',
    };
    const updated = await this.settingsService.upsert(
      'maintenance_mode',
      value,
      'object',
      'Mode maintenance portal PKKMB',
    );
    return {
      success: true,
      data: {
        enabled: (updated.value as { enabled?: boolean }).enabled === true,
        message: (updated.value as { message?: string }).message || '',
      },
    };
  }

  // CMS ENDPOINTS

  @UseGuards(JwtAuthGuard)
  @Get()
  async getAllSettings() {
    const data = await this.settingsService.getAll();
    return {
      success: true,
      data,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Put(':key')
  async updateSetting(
    @Param('key') key: string,
    @Body() updateDto: UpdateSettingDto,
  ) {
    const updated = await this.settingsService.upsert(
      key,
      updateDto.value,
      updateDto.type,
      updateDto.description,
    );
    return {
      success: true,
      data: updated,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('bulk')
  async bulkUpdateSettings(@Body() bulkDto: BulkUpdateSettingsDto) {
    const result = await this.settingsService.bulkUpsert(bulkDto.settings);
    return {
      success: true,
      message: 'Settings updated successfully',
      data: result,
    };
  }
}
