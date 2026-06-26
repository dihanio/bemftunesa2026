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
import { EventsService } from './events.service';
import {
  CreateEventDto,
  UpdateEventDto,
  UpdateEventStatusDto,
  EventQueryDto,
} from './dto/event.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import type { UserDocument } from '../schemas/user.schema';

@Controller('events')
export class EventsController {
  constructor(private eventsService: EventsService) {}

  // --- Public endpoints ---
  @Get('public')
  async findPublic(@Query() query: EventQueryDto) {
    return this.eventsService.findAll({ ...query, status: 'published' });
  }

  @Get('public/:slug')
  async findPublicBySlug(@Param('slug') slug: string) {
    const data = await this.eventsService.findBySlug(slug);
    return { success: true, data };
  }

  // --- CMS: Protected endpoints ---
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get()
  @RequiredPermissions('event:read')
  async findAll(@Query() query: EventQueryDto) {
    return this.eventsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Get(':id')
  @RequiredPermissions('event:read')
  async findById(@Param('id') id: string) {
    const data = await this.eventsService.findById(id);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Post()
  @RequiredPermissions('event:create')
  async create(
    @Body() dto: CreateEventDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.eventsService.create(dto, user);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id')
  @RequiredPermissions('event:update')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateEventDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.eventsService.update(id, dto, user);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Patch(':id/status')
  @RequiredPermissions('event:publish')
  async updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateEventStatusDto,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.eventsService.updateStatus(id, dto, user);
    return { success: true, data };
  }

  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Delete(':id')
  @RequiredPermissions('event:delete')
  async delete(
    @Param('id') id: string,
    @CurrentUser() user: UserDocument,
  ) {
    const data = await this.eventsService.delete(id, user);
    return { success: true, data };
  }
}
