import {
  Controller,
  Get,
  Post,
  Patch,
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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles, GetUser } from '../auth/decorators/auth.decorator';
import { RecruitmentService } from './recruitment.service';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';
import {
  ApplyRecruitmentSchema,
  ScoreApplicantSchema,
  UploadBerkasSchema,
} from './recruitment.dto';
import type {
  ApplyRecruitmentDto,
  ScoreApplicantDto,
  UploadBerkasDto,
} from './recruitment.dto';
import {
  PaginationQuerySwagger,
  PaginationQuerySchema,
} from '../common/dto/pagination.dto';
import type { PaginationQueryDto } from '../common/dto/pagination.dto';

@ApiTags('Recruitment (OR)')
@Controller('recruitment')
export class RecruitmentController {
  constructor(private readonly recruitmentService: RecruitmentService) {}

  @Post('apply')
  @ApiOperation({ summary: 'Submit pendaftaran open recruitment' })
  async apply(
    @Body(new ZodValidationPipe(ApplyRecruitmentSchema))
    body: ApplyRecruitmentDto,
  ) {
    return this.recruitmentService.apply(body);
  }

  @Post('upload')
  @ApiOperation({ summary: 'Upload berkas pendaftaran' })
  async upload(
    @Body(new ZodValidationPipe(UploadBerkasSchema)) body: UploadBerkasDto,
  ) {
    return this.recruitmentService.uploadBerkas(body);
  }

  @Get('status/:nim')
  @ApiOperation({ summary: 'Cek status pendaftaran' })
  async checkStatus(@Param('nim') nim: string) {
    return this.recruitmentService.checkStatus(nim);
  }

  @Get('results')
  @ApiOperation({ summary: 'Pengumuman hasil seleksi' })
  async results() {
    return this.recruitmentService.getResults();
  }

  // --- IMS (Kadep+) ---

  @Get('applicants')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Kadep')
  @ApiOperation({ summary: 'List semua pendaftar' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async listApplicants(
    @Query(new ZodValidationPipe(PaginationQuerySchema))
    query: PaginationQueryDto,
  ) {
    return this.recruitmentService.listApplicants(query);
  }

  @Post('score')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Kadep')
  @ApiOperation({ summary: 'Input skor wawancara' })
  async score(
    @Body(new ZodValidationPipe(ScoreApplicantSchema)) body: ScoreApplicantDto,
    @GetUser('userId') userId: string,
  ) {
    return this.recruitmentService.score(body, userId);
  }

  @Patch('applicants/:id/status')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('Kadep')
  @ApiOperation({ summary: 'Update status pendaftar' })
  async updateStatus(
    @Param('id') id: string,
    @Body() body: { status: string },
  ) {
    return this.recruitmentService.updateApplicantStatus(id, body.status);
  }
}
