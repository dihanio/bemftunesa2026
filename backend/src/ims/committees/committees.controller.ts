import { Controller, Get, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../auth/guards/roles.guard';
import { Roles } from '../../auth/decorators/auth.decorator';
import { CommitteesService } from './committees.service';

@ApiTags('IMS - Committees')
@Controller('ims/committees')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommitteesController {
  constructor(private readonly committeesService: CommitteesService) {}

  @Get('user/:id')
  @ApiOperation({ summary: 'Cek kepanitiaan anggota' })
  async userCommittees(@Param('id') id: string) {
    return this.committeesService.getUserCommittees(id);
  }

  @Get('proker/:id')
  @ApiOperation({ summary: 'List panitia per proker' })
  async prokerCommittees(@Param('id') id: string) {
    return this.committeesService.getProkerCommittees(id);
  }

  @Get('overview')
  @Roles('Kadep')
  @ApiOperation({ summary: 'Workload overview departemen' })
  async overview() {
    return this.committeesService.getOverview();
  }
}
