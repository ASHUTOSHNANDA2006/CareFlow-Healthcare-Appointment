import mongoose from 'mongoose';

const notificationSchema = new mongoose.Schema(
  {
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
    },
    type: {
      type: String,
      enum: [
        'BOOKING_CONFIRMATION',
        'APPOINTMENT_REMINDER',
        'CANCELLATION',
        'RESCHEDULE',
        'DOCTOR_LEAVE_CONFLICT',
        'MEDICATION_REMINDER',
      ],
      required: true,
    },
    channel: {
      type: String,
      enum: ['EMAIL'],
      default: 'EMAIL',
    },
    status: {
      type: String,
      enum: ['PENDING', 'SENT', 'FAILED'],
      default: 'PENDING',
    },
    retryCount: {
      type: Number,
      default: 0,
    },
    lastError: {
      type: String,
    },
    scheduledFor: {
      type: Date,
      default: Date.now,
    },
    sentAt: {
      type: Date,
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed, // Holds details like medication name, dosage, etc.
    },
  },
  {
    timestamps: true,
  }
);

// Index to quickly fetch pending notifications
notificationSchema.index({ status: 1, scheduledFor: 1 });

const Notification = mongoose.model('Notification', notificationSchema);

export default Notification;
