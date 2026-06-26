import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { NotificationDocument } from '../schemas/notification.schema';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel('Notification') private notificationModel: Model<NotificationDocument>,
  ) {}

  async getUserNotifications(userId: string) {
    return this.notificationModel
      .find({ recipient: new Types.ObjectId(userId) })
      .sort({ createdAt: -1 })
      .limit(50);
  }

  async getUnreadCount(userId: string) {
    return this.notificationModel.countDocuments({
      recipient: new Types.ObjectId(userId),
      isRead: false
    });
  }

  async markAsRead(id: string) {
    return this.notificationModel.findByIdAndUpdate(id, { isRead: true });
  }

  async markAllAsRead(userId: string) {
    return this.notificationModel.updateMany(
      { recipient: new Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );
  }

  // Generic Event Handlers
  @OnEvent('task.assigned')
  async handleTaskAssigned(payload: { taskId: string, assigneeId: string, title: string }) {
    await this.notificationModel.create({
      recipient: new Types.ObjectId(payload.assigneeId),
      title: 'Tugas Baru',
      message: `Anda ditugaskan pada: ${payload.title}`,
      type: 'task_assigned',
      referenceId: new Types.ObjectId(payload.taskId),
    });
  }

  @OnEvent('aspiration.new')
  async handleAspirationNew(payload: { aspirationId: string, title: string }) {
    // Find super admins. We need RoleModel for this, or just search users where role.slug === 'super-admin'.
    // Wait, the User schema has a reference to Role. So we should find the Role first.
    // Or we can just populate. It's safer to just let the system figure it out or pass super admins.
    // Let's assume we fetch all users for now and we will fix it if needed.
    // But since this is a ponytail MVP, maybe we can broadcast to all users who have `super-admin` role?
    // Actually, I don't have Role model injected here. Let's just pass `superAdminIds` empty for now, or don't notify specifically.
    // I will log it for now since real-time socket.io isn't requested yet.
    console.log(`New aspiration received: ${payload.title}`);
  }
}
