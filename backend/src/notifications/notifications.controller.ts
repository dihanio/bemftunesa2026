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
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/auth.decorator';
import { NotificationsService } from './notifications.service';
import { PaginationQuerySwagger } from '../common/dto/pagination.dto';

@ApiTags('Notifications')
@Controller('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'List in-app notifications (user sendiri)' })
  @ApiQuery({ type: PaginationQuerySwagger })
  async list(@Request() req: any, @Query() query: any) {
    return this.notificationsService.listForUser(req.user.userId, query);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Mark notification as read' })
  async markRead(@Param('id') id: string) {
    return this.notificationsService.markAsRead(id);
  }

  @Post('broadcast')
  @UseGuards(RolesGuard)
  @Roles('Admin')
  @ApiOperation({ summary: 'Broadcast notifikasi masal (admin)' })
  async broadcast(
    @Body() body: { title: string; message: string; category?: string },
  ) {
    return this.notificationsService.broadcast(body);
  }
}
