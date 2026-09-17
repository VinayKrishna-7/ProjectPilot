import mongoose from 'mongoose';
import { Notification, INotificationDocument } from '../models/Notification';
import { AppError } from '../utils/AppError';
import { emitToUser } from '../sockets';

export class NotificationService {
  async getNotifications(
    userId: mongoose.Types.ObjectId,
    page = 1,
    limit = 20
  ): Promise<{ notifications: INotificationDocument[]; unreadCount: number; total: number }> {
    const skip = (page - 1) * limit;
    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find({ recipient: userId })
        .populate('actor', 'name email avatar')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Notification.countDocuments({ recipient: userId }),
      Notification.countDocuments({ recipient: userId, isRead: false }),
    ]);
    return { notifications, unreadCount, total };
  }

  async markAsRead(notificationId: string, userId: mongoose.Types.ObjectId): Promise<void> {
    const notification = await Notification.findOne({
      _id: notificationId,
      recipient: userId,
    });
    if (!notification) throw new AppError('Notification not found', 404, 'NOT_FOUND');
    notification.isRead = true;
    await notification.save();
  }

  async markAllAsRead(userId: mongoose.Types.ObjectId): Promise<void> {
    await Notification.updateMany({ recipient: userId, isRead: false }, { $set: { isRead: true } });
  }

  async createNotification(data: {
    recipient: mongoose.Types.ObjectId | string;
    actor?: mongoose.Types.ObjectId | string;
    type: string;
    message: string;
    entityType?: string;
    entityId?: string;
  }): Promise<INotificationDocument> {
    const notification = await Notification.create(data);
    await notification.populate('actor', 'name email avatar');
    emitToUser(data.recipient.toString(), 'notification_created', notification);
    return notification;
  }
}

export const notificationService = new NotificationService();
