import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpsertSettingDto, UpdateHomepageDto } from './dto/settings.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('settings')
export class SettingsController {
  constructor(private settingsService: SettingsService) {}

  // --- Public: Homepage sections for frontend rendering ---
  @Get('homepage/public')
  async getHomepagePublic() {
    const data = await this.settingsService.getHomepage();
    const active = (data as { isActive: boolean }[]).filter((s) => s.isActive);
    return { success: true, data: active };
  }

  // --- Public: Read single setting by key ---
  @Get('public/:key')
  async getPublicSetting(@Param('key') key: string) {
    const data = await this.settingsService.findByKey(key);
    return { success: true, data };
  }

  // =================== CMS: Protected ===================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get()
  @Roles('super-admin')
  async findAll(@Query('group') group?: string) {
    const data = await this.settingsService.findAll(group);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get(':key')
  @Roles('super-admin')
  async findByKey(@Param('key') key: string) {
    const data = await this.settingsService.findByKey(key);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post()
  @Roles('super-admin')
  async upsert(@Body() dto: UpsertSettingDto) {
    const data = await this.settingsService.upsert(dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('batch')
  @Roles('super-admin')
  async upsertMany(@Body() dtos: UpsertSettingDto[]) {
    const data = await this.settingsService.upsertMany(dtos);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Delete(':key')
  @Roles('super-admin')
  async delete(@Param('key') key: string) {
    const data = await this.settingsService.delete(key);
    return { success: true, data };
  }

  // =================== Homepage Builder ===================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Get('homepage')
  @Roles('super-admin')
  async getHomepage() {
    const data = await this.settingsService.getHomepage();
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Post('homepage')
  @Roles('super-admin')
  async updateHomepage(@Body() dto: UpdateHomepageDto) {
    const data = await this.settingsService.updateHomepage(dto);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Patch('homepage/:id/toggle')
  @Roles('super-admin')
  async toggleSection(
    @Param('id') id: string,
    @Body('isActive') isActive: boolean,
  ) {
    const data = await this.settingsService.toggleHomepageSection(id, isActive);
    return { success: true, data };
  }
}
