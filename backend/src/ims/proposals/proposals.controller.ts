import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { CommitteeGuard } from '../../auth/guards/committee.guard';
import { Roles } from '../../auth/decorators/auth.decorator';
import { RequireCommitteeRoles } from '../../auth/decorators/committee.decorator';
import { RequirePermissions } from '../../permissions/permissions.decorator';
import { PermissionsGuard } from '../../permissions/permissions.guard';
import { ProposalsService } from './proposals.service';
import { PaginationQuerySwagger } from '../../common/dto/pagination.dto';

@ApiTags('IMS - Proposals & RAB')
@Controller('ims/proposals')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard, RolesGuard, CommitteeGuard)
export class ProposalsController {
  constructor(private readonly proposalsService: ProposalsService) {}

  @Get()
  @RequirePermissions('proker.read')
  @ApiOperation({ summary: 'List proposal' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async list(@Query() query: any, @Request() req: any) {
    const user = req.user;
    const currentRole = user?.role;
    const isBPI = [
      'Super Admin',
      'Admin Sistem',
      'System Administrator',
      'KaBEM',
      'WaKaBEM',
      'Bendahara',
      'Sekretaris',
    ].includes(currentRole);
    const departmentId = user?.department;
    return this.proposalsService.list(query, departmentId, isBPI);
  }

  @Post()
  @RequireCommitteeRoles(
    'Ketua Pelaksana',
    'Sekretaris Pelaksana',
    'Bendahara Pelaksana',
  )
  @RequirePermissions('documents.manage')
  @ApiOperation({ summary: 'Create proposal + RAB (OC Roles only)' })
  async create(@Body() body: any) {
    return this.proposalsService.create(body);
  }

  @Patch(':id/validate-admin')
  @Roles('Sekretaris')
  @RequirePermissions('documents.manage')
  @ApiOperation({
    summary: 'Asistensi & Validasi Administrasi Proposal (Sekretaris BEM BPI)',
  })
  async validateAdmin(
    @Param('id') id: string,
    @Body() body?: { note?: string; authorName?: string },
  ) {
    return this.proposalsService.validateAdmin(id, body);
  }

  @Patch(':id/validate-finance')
  @Roles('Bendahara')
  @RequirePermissions('finance.approve')
  @ApiOperation({
    summary: 'Asistensi & Validasi Anggaran RAB Proposal (Bendahara BEM BPI)',
  })
  async validateFinance(
    @Param('id') id: string,
    @Body() body?: { note?: string; authorName?: string },
  ) {
    return this.proposalsService.validateFinance(id, body);
  }

  @Patch(':id/revision')
  @Roles(
    'Super Admin',
    'WaKaBEM',
    'Sekretaris',
    'Bendahara',
    'Kadep',
    'Wakadep',
  )
  @RequirePermissions('documents.manage')
  @ApiOperation({ summary: 'Pengajuan Catatan Revisi Proposal (BPI / SC)' })
  async requestRevision(
    @Param('id') id: string,
    @Body() body: { note: string; authorName: string },
  ) {
    return this.proposalsService.requestRevision(id, body);
  }

  @Patch(':id/approve')
  @Roles('Super Admin', 'WaKaBEM')
  @RequirePermissions('documents.approve')
  @ApiOperation({
    summary: 'Persetujuan / Approval Akhir Proposal (KaBEM & WaKaBEM BPI)',
  })
  async approve(
    @Param('id') id: string,
    @Body() body?: { note?: string; authorName?: string },
  ) {
    return this.proposalsService.approve(id, body);
  }

  @Get(':id/rab')
  @RequirePermissions('proker.read')
  @ApiOperation({ summary: 'Get RAB items for a proposal' })
  async getRabItems(@Param('id') id: string) {
    return this.proposalsService.getRabItems(id);
  }

  @Patch('rab/:itemId')
  @Roles('Bendahara', 'Super Admin')
  @RequirePermissions('finance.approve')
  @ApiOperation({
    summary:
      'Update validation status of an individual RAB item (Bendahara/Admin)',
  })
  async updateRabItemStatus(
    @Param('itemId') itemId: string,
    @Body() body: { status: 'Approved' | 'Rejected' },
    @Request() req: any,
  ) {
    return this.proposalsService.updateRabItemStatus(
      itemId,
      body.status,
      req.user.userId,
    );
  }
}
