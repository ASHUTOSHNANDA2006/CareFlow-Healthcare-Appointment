import mongoose from 'mongoose';

const leaveSchema = new mongoose.Schema(
  {
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    date: {
      type: Date,
      required: [true, 'Leave date is required'],
    },
    reason: {
      type: String,
      trim: true,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Prevent duplicate leave entries for the same doctor on the same date
leaveSchema.index({ doctorId: 1, date: 1 }, { unique: true });

const Leave = mongoose.model('Leave', leaveSchema);

export default Leave;
