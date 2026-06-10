import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Notification } from '../database/schema/core';
import { User } from '../database/schema/users';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import {
  paginate,
  parsePaginationQuery,
} from '../common/helpers/pagination.helper';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notification.name)
    private notificationModel: Model<Notification>,
    @InjectModel(User.name) private userModel: Model<User>,
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  async createNotification(data: {
    recipientId: string;
    title: string;
    message: string;
    category?: string;
    actionData?: Record<string, unknown>;
  }) {
    // 1. Save in Mongoose for In-App Dashboard
    const notification = await this.notificationModel.create({
      recipientId: new Types.ObjectId(data.recipientId),
      title: data.title,
      message: data.message,
      category: data.category || 'info',
      actionData: data.actionData,
    });

    // 2. Fetch User contact info and queue background jobs (Email & WhatsApp)
    const recipient = await this.userModel.findById(data.recipientId);
    if (recipient) {
      try {
        await this.notificationsQueue.add('sendEmail', {
          recipientEmail: recipient.email,
          recipientName: recipient.name,
          title: data.title,
          message: data.message,
          link: data.actionData?.link as string | undefined,
        });

        await this.notificationsQueue.add('sendWhatsApp', {
          recipientPhone:
            (recipient as unknown as { phone?: string }).phone ||
            '081234567890', // Default mockup phone
          recipientName: recipient.name,
          title: data.title,
          message: data.message,
          link: data.actionData?.link as string | undefined,
        });
      } catch (err) {
        console.error('[NotificationsService] Error queuing jobs:', err);
      }
    }

    return notification;
  }

  async notifyRole(
    role: string,
    data: {
      title: string;
      message: string;
      category?: string;
      actionData?: Record<string, unknown>;
    },
  ) {
    try {
      const users = await this.userModel.find({
        role,
        isActive: true,
        deletedAt: null,
      });

      for (const user of users) {
        await this.createNotification({
          recipientId: user._id.toString(),
          title: data.title,
          message: data.message,
          category: data.category,
          actionData: data.actionData,
        });
      }
    } catch (err) {
      console.error(
        `[NotificationsService] Failed to notify role ${role}:`,
        err,
      );
    }
  }

  async listForUser(userId: string, query: any) {
    const options = parsePaginationQuery(query);
    return paginate(this.notificationModel, { recipientId: userId }, options, [
      'title',
      'message',
    ]);
  }

  async markAsRead(id: string) {
    const notification = await this.notificationModel.findByIdAndUpdate(
      id,
      { $set: { isRead: true } },
      { new: true },
    );
    if (!notification)
      throw new NotFoundException('Notifikasi tidak ditemukan');
    return { data: notification, message: 'Notifikasi ditandai sudah dibaca' };
  }

  async broadcast(data: { title: string; message: string; category?: string }) {
    const activeUsers = await this.userModel
      .find({ isActive: true, deletedAt: null })
      .select('_id');
    const notifications = activeUsers.map((user) => ({
      recipientId: user._id,
      title: data.title,
      message: data.message,
      category: data.category || 'info',
    }));
    await this.notificationModel.insertMany(notifications);
    return { message: `Broadcast berhasil ke ${activeUsers.length} user` };
  }
}
