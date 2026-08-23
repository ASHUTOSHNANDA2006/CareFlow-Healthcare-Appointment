import mongoose from 'mongoose';

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
    },
    specialization: {
      type: String,
      required: [true, 'Specialization is required'],
      trim: true,
    },
    qualification: {
      type: String,
      required: [true, 'Qualification is required'],
      trim: true,
    },
    experience: {
      type: Number,
      required: [true, 'Experience is required'],
      min: [0, 'Experience cannot be negative'],
    },
    slotDuration: {
      type: Number,
      required: [true, 'Slot duration is required'],
      default: 30, // in minutes
      min: [10, 'Slot duration must be at least 10 minutes'],
    },
    workingHours: {
      start: {
        type: String,
        required: [true, 'Working hours start time is required'],
        default: '09:00', // Format: HH:MM
      },
      end: {
        type: String,
        required: [true, 'Working hours end time is required'],
        default: '17:00', // Format: HH:MM
      },
    },
  },
  {
    timestamps: true,
  }
);

const Doctor = mongoose.model('Doctor', doctorSchema);

export default Doctor;
