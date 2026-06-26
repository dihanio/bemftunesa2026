import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards } from '@nestjs/common';
import { CabinetPeriodService } from './cabinet-period.service';
import { CreateCabinetPeriodDto, UpdateCabinetPeriodDto, QueryCabinetPeriodDto } from './dto/cabinet-period.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('cabinet-periods')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CabinetPeriodController {
  constructor(private readonly cabinetPeriodService: CabinetPeriodService) {}

  @Post()
  @Roles('super-admin', 'bpi')
  async create(@Body() createCabinetPeriodDto: CreateCabinetPeriodDto) {
    const data = await this.cabinetPeriodService.create(createCabinetPeriodDto);
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: QueryCabinetPeriodDto) {
    const result = await this.cabinetPeriodService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.cabinetPeriodService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('super-admin', 'bpi')
  async update(@Param('id') id: string, @Body() updateCabinetPeriodDto: UpdateCabinetPeriodDto) {
    const data = await this.cabinetPeriodService.update(id, updateCabinetPeriodDto);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('super-admin')
  async remove(@Param('id') id: string) {
    const data = await this.cabinetPeriodService.delete(id);
    return { success: true, data };
  }
}
