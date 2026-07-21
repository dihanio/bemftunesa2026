import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { LettersService } from './letters.service';
import { CreateLetterDto, UpdateLetterDto, QueryLetterDto } from './dto/letter.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { ROLES_SURAT_ADMIN } from '../common/constants/roles';

@Controller('letters')
@UseGuards(JwtAuthGuard, RolesGuard)
export class LettersController {
  constructor(private readonly lettersService: LettersService) {}

  @Post()
  async create(@Body() createLetterDto: CreateLetterDto, @Req() req: import('express').Request) {
    const userId = req.user!.userId as string;
    const userDepartment = req.user!.organizationId?.toString();
    const data = await this.lettersService.create(createLetterDto, userId, userDepartment);
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: QueryLetterDto, @Req() req: import('express').Request) {
    const userRole = (typeof req.user!.activeRoleId === 'object' && req.user!.activeRoleId !== null && '_id' in req.user!.activeRoleId) ? (req.user!.activeRoleId as { _id: { toString(): string } })._id.toString() : req.user!.activeRoleId as string;
    const userDepartment = req.user!.organizationId?.toString();
    const result = await this.lettersService.findAll(query, userRole, userDepartment);
    return { success: true, ...result };
  }

  @Get('stats')
  async getStats() {
    const data = await this.lettersService.getStats();
    return { success: true, data };
  }

  @Get('dss/smart')
  async getSmartPriority() {
    return this.lettersService.calculateSmartPriority();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.lettersService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateLetterDto: UpdateLetterDto, @Req() req: import('express').Request) {
    const userRole = (typeof req.user!.activeRoleId === 'object' && req.user!.activeRoleId !== null && '_id' in req.user!.activeRoleId) ? (req.user!.activeRoleId as { _id: { toString(): string } })._id.toString() : req.user!.activeRoleId as string;
    const userDepartment = req.user!.organizationId?.toString();
    const data = await this.lettersService.update(id, updateLetterDto, userRole, userDepartment);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles(...ROLES_SURAT_ADMIN)
  async remove(@Param('id') id: string) {
    const data = await this.lettersService.delete(id);
    return { success: true, data };
  }
}
