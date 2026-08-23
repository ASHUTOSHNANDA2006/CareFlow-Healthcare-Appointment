import mongoose from 'mongoose';

const symptomReportSchema = new mongoose.Schema(
  {
    patientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    appointmentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Appointment',
      required: true,
      unique: true,
    },
    symptoms: {
      type: String,
      required: [true, 'Raw symptoms text is required'],
      trim: true,
    },
    aiStatus: {
      type: String,
      enum: ['PENDING', 'COMPLETED', 'FAILED'],
      default: 'PENDING',
    },
    aiSummary: {
      urgency: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
      },
      chiefComplaint: String,
      keySymptoms: [String],
      suggestedQuestions: [String],
    },
  },
  {
    timestamps: true,
  }
);

const SymptomReport = mongoose.model('SymptomReport', symptomReportSchema);

export default SymptomReport;
