import {
  Controller,
  Get,
  Post,
  Put,
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
import { ProkerService } from './proker.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CommitteeGuard } from '../../auth/guards/committee.guard';
import { Roles, GetUser } from '../../auth/decorators/auth.decorator';
import { RequireCommitteeRoles } from '../../auth/decorators/committee.decorator';
import { RequirePermissions } from '../../permissions/permissions.decorator';
import { PermissionsGuard } from '../../permissions/permissions.guard';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe';
import {
  CreateProkerSchema,
  UpdateProkerSchema,
  UpdateProgressSchema,
  AssignMemberSchema,
} from './proker.dto';
import { PaginationQuerySwagger } from '../../common/dto/pagination.dto';

@ApiTags('IMS - Proker')
@Controller('ims/proker')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard, CommitteeGuard)
export class ProkerController {
  constructor(private readonly prokerService: ProkerService) {}

  @Get()
  @RequirePermissions('proker.read')
  @ApiOperation({ summary: 'List program kerja (filter by department)' })
  @ApiQuery({ type: PaginationQuerySwagger })
  @ApiQuery({ name: 'departmentId', required: false })
  async list(@Query() query: any) {
    return this.prokerService.list(query);
  }

  @Post()
  @Roles('Kadep')
  @RequirePermissions('proker.manage')
  @ApiOperation({ summary: 'Create program kerja baru (BPI Kadep only)' })
  @UsePipes(new ZodValidationPipe(CreateProkerSchema))
  async create(@Body() body: any) {
    return this.prokerService.create(body);
  }

  @Put(':id')
  @RequireCommitteeRoles(
    'Ketua Pelaksana',
    'Wakil Ketua Pelaksana',
    'Koordinator Divisi',
    'Staff Panitia',
  )
  @RequirePermissions('proker.manage')
  @ApiOperation({ summary: 'Update program kerja' })
  async update(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProkerSchema)) body: any,
  ) {
    return this.prokerService.update(id, body);
  }

  @Patch(':id/progress')
  @RequireCommitteeRoles(
    'Ketua Pelaksana',
    'Wakil Ketua Pelaksana',
    'Koordinator Divisi',
    'Staff Panitia',
  )
  @RequirePermissions('proker.manage')
  @ApiOperation({ summary: 'Update progress proker (OC Roles & SC)' })
  async updateProgress(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(UpdateProgressSchema)) body: any,
  ) {
    return this.prokerService.updateProgress(id, body);
  }

  @Get(':id/members')
  @RequirePermissions('committee.read')
  @ApiOperation({ summary: 'List anggota proker' })
  async listMembers(@Param('id') id: string) {
    return this.prokerService.listMembers(id);
  }

  @Post(':id/members')
  @RequireCommitteeRoles('Ketua Pelaksana')
  @RequirePermissions('committee.manage')
  @ApiOperation({ summary: 'Assign member ke proker (Ketupel & Kadep only)' })
  async assignMember(
    @Param('id') id: string,
    @Body(new ZodValidationPipe(AssignMemberSchema)) body: any,
  ) {
    return this.prokerService.assignMember(id, body);
  }
}
