import {
  Controller,
  Get,
  Post,
  Put,
  Param,
  Query,
  Body,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorator';
import { MeetingsService } from './meetings.service';
import {
  PaginationQuerySwagger,
  PaginationQuerySchema,
} from '../../common/dto/pagination.dto';
import type { PaginationQueryDto } from '../../common/dto/pagination.dto';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateMeetingSchema,
  AddMeetingNoteSchema,
  AttendMeetingSchema,
} from './meetings.dto';
import type {
  CreateMeetingDto,
  AddMeetingNoteDto,
  AttendMeetingDto,
} from './meetings.dto';

@ApiTags('IMS - Meetings & Absensi')
@Controller('ims/meetings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class MeetingsController {
  constructor(private readonly meetingsService: MeetingsService) {}

  @Get()
  @ApiOperation({ summary: 'List jadwal & riwayat rapat' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async list(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryDto,
  ) {
    return this.meetingsService.list(query);
  }

  @Post()
  @Roles('Kadep')
  @ApiOperation({ summary: 'Buat agenda rapat & generate QR' })
  async create(
    @Body(new ZodValidationPipe(CreateMeetingSchema)) body: CreateMeetingDto,
  ) {
    return this.meetingsService.create(body);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Detail rapat, notulensi & riwayat absensi' })
  async findOne(@Param('id') id: string) {
    return this.meetingsService.findOne(id);
  }

  @Post(':id/attend')
  @Roles('Staff')
  @ApiOperation({ summary: 'Absensi via scan QR' })
  async attend(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AttendMeetingSchema)) body: AttendMeetingDto,
  ) {
    return this.meetingsService.attend(
      id,
      body.userId,
      body.latitude,
      body.longitude,
    );
  }

  @Put(':id/notes')
  @Roles('Sekretaris')
  @ApiOperation({ summary: 'Input notulensi rapat' })
  async addNotes(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AddMeetingNoteSchema)) body: AddMeetingNoteDto,
  ) {
    return this.meetingsService.addNotes(id, body);
  }
}
