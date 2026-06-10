import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  UsePipes,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';
import { PkkmbService } from './pkkmb.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  PkkmbAuthSchema,
  SubmitTaskSchema,
  CreateTaskSchema,
  CreateAnnouncementSchema,
  GradeSubmissionSchema,
} from './pkkmb.dto';
import { PaginationQuerySwagger } from '../common/dto/pagination.dto';

@ApiTags('PKKMB')
@Controller('pkkmb')
export class PkkmbController {
  constructor(private readonly pkkmbService: PkkmbService) {}

  // --- Public / Peserta ---

  @Post('auth')
  @ApiOperation({ summary: 'Login peserta PKKMB (NIM-based)' })
  @UsePipes(new ZodValidationPipe(PkkmbAuthSchema))
  async auth(@Body() body: any) {
    return this.pkkmbService.authParticipant(body.nim);
  }

  @Get('schedule')
  @ApiOperation({ summary: 'Jadwal PKKMB' })
  async schedule() {
    return this.pkkmbService.getSchedule();
  }

  @Get('tasks')
  @ApiOperation({ summary: 'List tugas PKKMB' })
  async listTasks() {
    return this.pkkmbService.listTasks();
  }

  @Get('tasks/:id')
  @ApiOperation({ summary: 'Detail tugas' })
  async getTask(@Param('id') id: string) {
    return this.pkkmbService.getTask(id);
  }

  @Post('tasks/:id/submit')
  @ApiOperation({ summary: 'Submit tugas' })
  async submitTask(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(SubmitTaskSchema)) body: any,
  ) {
    return this.pkkmbService.submitTask(id, body);
  }

  @Get('announcements')
  @ApiOperation({ summary: 'List pengumuman PKKMB' })
  async announcements() {
    return this.pkkmbService.listAnnouncements();
  }

  @Get('gallery')
  @ApiOperation({ summary: 'Galeri foto/video PKKMB' })
  async gallery() {
    return this.pkkmbService.getGallery();
  }

  // --- Admin (Panitia IMS) ---

  @Post('admin/tasks')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Panitia')
  @ApiOperation({ summary: 'Create tugas baru' })
  @UsePipes(new ZodValidationPipe(CreateTaskSchema))
  async createTask(@Body() body: any) {
    return this.pkkmbService.createTask(body);
  }

  @Post('admin/announcements')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Panitia')
  @ApiOperation({ summary: 'Create pengumuman' })
  @UsePipes(new ZodValidationPipe(CreateAnnouncementSchema))
  async createAnnouncement(@Body() body: any) {
    return this.pkkmbService.createAnnouncement(body);
  }

  @Patch('admin/submissions/:id')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Panitia')
  @ApiOperation({ summary: 'Grade submission' })
  async gradeSubmission(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(GradeSubmissionSchema)) body: any,
  ) {
    return this.pkkmbService.gradeSubmission(id, body);
  }
}
