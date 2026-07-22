import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CommitteesService } from './committees.service';
import {
  CreateCommitteeDto,
  UpdateCommitteeDto,
  AddMemberDto,
} from './dto/committee.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLES_PROKER_ADMIN, ROLES_DELETE } from '../common/constants/roles';

@Controller('committees')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CommitteesController {
  constructor(private readonly committeesService: CommitteesService) {}

  @Post()
  @Roles(...ROLES_PROKER_ADMIN)
  async create(@Body() dto: CreateCommitteeDto) {
    const data = await this.committeesService.create(dto);
    return { success: true, data };
  }

  @Get()
  async findAll(@Query('programId') programId?: string) {
    const data = await this.committeesService.findAll(programId);
    return { success: true, data };
  }

  @Get('program/:programId')
  async findByProgram(@Param('programId') programId: string) {
    const data = await this.committeesService.findByProgramId(programId);
    return { success: true, data };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.committeesService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @Roles(...ROLES_PROKER_ADMIN)
  async update(@Param('id') id: string, @Body() dto: UpdateCommitteeDto) {
    const data = await this.committeesService.update(id, dto);
    return { success: true, data };
  }

  @Post(':id/members')
  @Roles(...ROLES_PROKER_ADMIN)
  async addMember(@Param('id') id: string, @Body() dto: AddMemberDto) {
    const data = await this.committeesService.addMember(id, dto);
    return { success: true, data };
  }

  @Delete(':id/members/:userId')
  @Roles(...ROLES_PROKER_ADMIN)
  async removeMember(@Param('id') id: string, @Param('userId') userId: string) {
    const data = await this.committeesService.removeMember(id, userId);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles(...ROLES_DELETE)
  async remove(@Param('id') id: string) {
    const data = await this.committeesService.delete(id);
    return { success: true, data };
  }
}
