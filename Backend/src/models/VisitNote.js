import mongoose from 'mongoose';

const visitNoteSchema = new mongoose.Schema(
  {
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      required: true,
    },
    clinicalNotes: {
      type: String,
      required: [true, 'Clinical notes are required'],
      trim: true,
    },
    diagnosis: {
      type: String,
      trim: true,
    },
    followUp: {
      type: String,
      trim: true,
    },
    prescription: [
      {
        name: { type: String, required: true },
        dosage: { type: String, required: true },
        frequency: { type: String, required: true },
        duration: { type: String, required: true },
      },
    ],
    aiStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    patientSummary: {
      summary: String,
      medications: [
        {
          name: String,
          dosage: String,
          frequency: String,
          duration: String,
        },
      ],
      followUp: String,
      precautions: [String],
    },
  },
  {
    timestamps: true,
  }
);

const VisitNote = mongoose.model('VisitNote', visitNoteSchema);

export default VisitNote;
