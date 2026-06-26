import { Controller, Get, Post, Body, Put, Param, Delete, Query, UseGuards, Request } from '@nestjs/common';
import { ProgramsService } from './programs.service';
import { CreateProgramDto, UpdateProgramDto, QueryProgramDto } from './dto/program.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('ims/proker')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProgramsController {
  constructor(private readonly programsService: ProgramsService) {}

  @Post()
  @Roles('super-admin', 'kabem', 'sekretaris', 'kadep')
  async create(@Body() createProgramDto: CreateProgramDto) {
    const data = await this.programsService.create(createProgramDto);
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: QueryProgramDto) {
    const result = await this.programsService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.programsService.findById(id);
    return { success: true, data };
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateProgramDto: UpdateProgramDto, @Request() req: any) {
    const data = await this.programsService.update(id, updateProgramDto, req.user);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('super-admin', 'kabem')
  async remove(@Param('id') id: string) {
    const data = await this.programsService.delete(id);
    return { success: true, data };
  }
}
