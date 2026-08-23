import mongoose from 'mongoose';

const slotHoldSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['HELD', 'CONFIRMED', 'EXPIRED'],
      default: 'HELD',
    },
    expiresAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// TTL Index for auto expiration
slotHoldSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Atomic checks index for unique hold per doctor/slot
slotHoldSchema.index(
  { doctorId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'HELD' },
  }
);

const SlotHold = mongoose.model('SlotHold', slotHoldSchema);

export default SlotHold;
