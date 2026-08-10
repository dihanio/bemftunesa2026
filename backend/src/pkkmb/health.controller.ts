import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequiredPermissions } from '../auth/decorators/required-permission.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { PkkmbPermission } from '../common/auth/pkkmb-permissions';
import { HealthService } from './health.service';
import {
  UpsertHealthProfileDto,
  CreateHealthConditionDto,
  OnboardingConsentDto,
} from './dto/health.dto';

@ApiTags('pkkmb')
@ApiBearerAuth('JWT')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller('pkkmb')
export class HealthController {
  constructor(private readonly healthService: HealthService) {}

  // ── MASTER CONDITIONS (admin / tim kesehatan) ─────────────
  @Get('health/conditions')
  @RequiredPermissions(PkkmbPermission.HEALTH_MANAGE)
  @ApiOperation({ summary: 'Daftar master penyakit (admin/tim kesehatan)' })
  listConditions() {
    return this.healthService.listConditions();
  }

  @Post('health/conditions')
  @RequiredPermissions(PkkmbPermission.HEALTH_MANAGE)
  @ApiOperation({ summary: 'Tambah master penyakit' })
  createCondition(@Body() dto: CreateHealthConditionDto) {
    return this.healthService.createCondition(dto);
  }

  @Delete('health/conditions/:id')
  @RequiredPermissions(PkkmbPermission.HEALTH_MANAGE)
  @ApiOperation({ summary: 'Hapus master penyakit' })
  deleteCondition(@Param('id') id: string) {
    return this.healthService.deleteCondition(id);
  }

  // ── OWN PROFILE (maba) ────────────────────────────────────
  @Get('health/me')
  @RequiredPermissions(PkkmbPermission.HEALTH_READ_OWN)
  @ApiOperation({ summary: 'Profil kesehatan milik sendiri (maba)' })
  getMyHealth(@CurrentUser() user: { userId: string }) {
    return this.healthService.getMyProfile(user.userId);
  }

  @Put('health/me')
  @RequiredPermissions(PkkmbPermission.HEALTH_WRITE_OWN)
  @ApiOperation({
    summary: 'Simpan profil kesehatan + riwayat (maba)',
  })
  upsertHealth(
    @CurrentUser() user: { userId: string },
    @Body() dto: UpsertHealthProfileDto,
  ) {
    return this.healthService.upsertProfile(user.userId, dto);
  }

  // ── CONSENT ───────────────────────────────────────────────
  @Post('onboard/consent')
  @RequiredPermissions(PkkmbPermission.CONSENT_WRITE_OWN)
  @ApiOperation({
    summary:
      'Simpan persetujuan + tanda tangan digital & selesaikan onboarding',
  })
  completeConsent(
    @CurrentUser() user: { userId: string },
    @Body() dto: OnboardingConsentDto,
  ) {
    return this.healthService.completeConsent(user.userId, dto);
  }

  // ── ADMIN / TIM KESEHATAN ─────────────────────────────────
  @Get('health/all')
  @RequiredPermissions(PkkmbPermission.HEALTH_READ_ALL)
  @ApiOperation({ summary: 'Data kesehatan semua mahasiswa (RBAC)' })
  listAll(@CurrentUser() user: { userId: string; permissions?: string[] }) {
    return this.healthService.listAll(user.permissions || []);
  }
}
