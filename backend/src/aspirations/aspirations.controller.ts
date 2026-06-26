import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { AspirationsService } from './aspirations.service';
import { CreateAspirationDto, UpdateAspirationDto, QueryAspirationDto } from './dto/aspiration.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('aspirations')
export class AspirationsController {
  constructor(private readonly aspirationsService: AspirationsService) {}

  // Public endpoint for submitting aspirations
  @Post()
  async create(@Body() createAspirationDto: CreateAspirationDto, @Req() req: any) {
    // If JWT token is present, we could extract userId. For now, pass null or get from auth middleware if used
    const userId = req.user ? req.user.userId : undefined;
    const data = await this.aspirationsService.create(createAspirationDto, userId);
    return { success: true, data };
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  async findAll(@Query() query: QueryAspirationDto) {
    const result = await this.aspirationsService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  async findOne(@Param('id') id: string) {
    const data = await this.aspirationsService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super-admin', 'bpi', 'kadep') // Staff shouldn't change SLA or official responses alone
  async update(@Param('id') id: string, @Body() updateAspirationDto: UpdateAspirationDto) {
    const data = await this.aspirationsService.update(id, updateAspirationDto);
    return { success: true, data };
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('super-admin')
  async remove(@Param('id') id: string) {
    const data = await this.aspirationsService.delete(id);
    return { success: true, data };
  }
}
