import mongoose from 'mongoose';

const appointmentSchema = new mongoose.Schema(
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
      required: [true, 'Appointment date is required'],
    },
    startTime: {
      type: String,
      required: [true, 'Start time (HH:MM) is required'],
    },
    endTime: {
      type: String,
      required: [true, 'End time (HH:MM) is required'],
    },
    status: {
      type: String,
      enum: ['PENDING', 'CONFIRMED', 'REJECTED', 'CANCELLED', 'COMPLETED'],
      default: 'CONFIRMED',
    },
    holdExpiresAt: {
      type: Date,
    },
    symptomReportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'SymptomReport',
    },
    visitNoteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'VisitNote',
    },
    googleCalendarEventId: {
      type: String,
    },
    googleCalendarSyncStatus: {
      type: String,
      enum: ['PENDING', 'SYNCED', 'FAILED'],
      default: 'PENDING',
    },
  },
  {
    timestamps: true,
  }
);

// Indexes
appointmentSchema.index({ patientId: 1, date: 1 });
appointmentSchema.index({ status: 1 });

// Concurrency prevention: unique index on active slots per doctor per start time
// Excludes cancelled and rejected slots using partial filter expressions
appointmentSchema.index(
  { doctorId: 1, date: 1, startTime: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
    },
  }
);

const Appointment = mongoose.model('Appointment', appointmentSchema);

export default Appointment;
