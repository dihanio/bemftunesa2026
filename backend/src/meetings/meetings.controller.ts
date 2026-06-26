import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { MeetingsService } from './meetings.service';
import { CreateMeetingDto, UpdateMeetingDto, QueryMeetingDto } from './dto/meeting.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('meetings')
@UseGuards(JwtAuthGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Post()
  async create(@Body() createMeetingDto: CreateMeetingDto) {
    const data = await this.meetingsService.create(createMeetingDto);
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: QueryMeetingDto) {
    const result = await this.meetingsService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.meetingsService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateMeetingDto: UpdateMeetingDto) {
    const data = await this.meetingsService.update(id, updateMeetingDto);
    return { success: true, data };
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    const data = await this.meetingsService.delete(id);
    return { success: true, data };
  }
}
