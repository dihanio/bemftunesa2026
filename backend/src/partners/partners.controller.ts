import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { PartnersService } from './partners.service';
import { CreatePartnerDto, UpdatePartnerDto, PartnerQueryDto } from './dto/partner.dto';

@ApiTags('partners')
@Controller('partners')
export class PartnersController {
  constructor(private readonly partnersService: PartnersService) {}

  // ─── Public ────────────────────────────────────────────────────────────────

  @Get('public')
  @ApiOperation({ summary: 'List all active partners/sponsors (public)' })
  @ApiQuery({ name: 'type', required: false, enum: ['partner', 'sponsor', 'media_partner', 'supporter'] })
  @ApiQuery({ name: 'period', required: false })
  async findPublic(
    @Query('type') type?: string,
    @Query('period') period?: string,
  ) {
    const data = await this.partnersService.findPublic(type, period);
    return { success: true, data };
  }

  // ─── CMS (authenticated) ───────────────────────────────────────────────────

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('partners:read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'List all partners (CMS)' })
  async findAll(@Query() query: PartnerQueryDto) {
    return this.partnersService.findAll(query);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('partners:read')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Get partner by ID' })
  async findOne(@Param('id') id: string) {
    const data = await this.partnersService.findOne(id);
    return { success: true, data };
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('partners:create')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Create new partner/sponsor' })
  async create(@Body() dto: CreatePartnerDto) {
    const data = await this.partnersService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('partners:update')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Update partner' })
  async update(@Param('id') id: string, @Body() dto: UpdatePartnerDto) {
    const data = await this.partnersService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequiredPermissions('partners:delete')
  @ApiBearerAuth('JWT')
  @ApiOperation({ summary: 'Delete partner' })
  async remove(@Param('id') id: string) {
    await this.partnersService.remove(id);
    return { success: true, message: 'Partner deleted' };
  }
}
