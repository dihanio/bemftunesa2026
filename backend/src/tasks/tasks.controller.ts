import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, Req } from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto, UpdateTaskDto, QueryTaskDto } from './dto/task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @Roles('super-admin', 'bpi', 'kadep', 'wakadep') // Any leader can create tasks
  async create(@Body() createTaskDto: CreateTaskDto, @Req() req: any) {
    const data = await this.tasksService.create(createTaskDto, req.user.userId);
    return { success: true, data };
  }

  @Get()
  async findAll(@Query() query: QueryTaskDto) {
    const result = await this.tasksService.findAll(query);
    return { success: true, ...result };
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    const data = await this.tasksService.findById(id);
    return { success: true, data };
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTaskDto: UpdateTaskDto) {
    // Note: Staff can update status. For production, add deeper ownership checks here if needed.
    const data = await this.tasksService.update(id, updateTaskDto);
    return { success: true, data };
  }

  @Delete(':id')
  @Roles('super-admin', 'bpi', 'kadep') 
  async remove(@Param('id') id: string) {
    const data = await this.tasksService.delete(id);
    return { success: true, data };
  }
}
