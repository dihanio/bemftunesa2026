import { Controller, Get, Patch, Param, UseGuards, Req } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Get()
  async getMyNotifications(@Req() req) {
    return {
      success: true,
      data: await this.notificationsService.getUserNotifications(req.user.id),
    };
  }

  @Get('unread-count')
  async getUnreadCount(@Req() req) {
    return {
      success: true,
      data: await this.notificationsService.getUnreadCount(req.user.id),
    };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id') id: string) {
    return {
      success: true,
      data: await this.notificationsService.markAsRead(id),
    };
  }

  @Patch('read-all')
  async markAllAsRead(@Req() req) {
    return {
      success: true,
      data: await this.notificationsService.markAllAsRead(req.user.id),
    };
  }
}
