import Notification from '../../models/Notification.js';
import User from '../../models/User.js';
import { sendEmail } from './email.service.js';

export const processNotifications = async () => {
  const now = new Date();
  const pendingNotifications = await Notification.find({
    status: { $in: ['PENDING', 'FAILED'] },
    scheduledFor: { $lte: now },
    retryCount: { $lt: 3 }, // Bounded retry threshold limit (3 retries)
  }).populate('recipientId', 'name email');

  for (const notification of pendingNotifications) {
    try {
      const recipient = notification.recipientId;
      if (!recipient || !recipient.email) {
        throw new Error('Recipient details or email missing.');
      }

      // Format template elements from metadata or generic schemas
      const details = {
        patientName: recipient.name,
        date: notification.metadata?.date || 'N/A',
        startTime: notification.metadata?.startTime || 'N/A',
        reason: notification.metadata?.reason || '',
        medicationName: notification.metadata?.medicationName || '',
        dosage: notification.metadata?.dosage || '',
        frequency: notification.metadata?.frequency || '',
        duration: notification.metadata?.duration || '',
      };

      await sendEmail(recipient.email, notification.type, details);

      notification.status = 'SENT';
      notification.sentAt = new Date();
      notification.lastError = undefined;
      await notification.save();
    } catch (error) {
      console.error(`[Notification process error] ID ${notification._id}:`, error.message);
      
      notification.retryCount += 1;
      notification.lastError = error.message;
      notification.status = notification.retryCount >= 3 ? 'FAILED' : 'PENDING';
      await notification.save();
    }
  }
};
