import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './dto/user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { PaginationQueryDto } from '../common/dto/pagination.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles('super-admin', 'bpi', 'kadep')
  async findAll(@Query() query: PaginationQueryDto) {
    return this.usersService.findAll(query);
  }

  @Get(':id')
  @Roles('super-admin', 'bpi', 'kadep')
  async findById(@Param('id') id: string) {
    const data = await this.usersService.findById(id);
    return { success: true, data };
  }

  @Post()
  @Roles('super-admin')
  async create(@Body() dto: CreateUserDto) {
    const data = await this.usersService.create(dto);
    return { success: true, data };
  }

  @Patch(':id')
  @Roles('super-admin')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    const data = await this.usersService.update(id, dto);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('super-admin')
  async delete(@Param('id') id: string) {
    const data = await this.usersService.delete(id);
    return { success: true, data };
  }
}
