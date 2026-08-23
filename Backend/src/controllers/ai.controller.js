import SymptomReport from '../models/SymptomReport.js';
import VisitNote from '../models/VisitNote.js';
import Appointment from '../models/Appointment.js';
import { analyzeSymptoms } from '../services/ai/preVisit.service.js';
import { summarizeVisit } from '../services/ai/postVisit.service.js';
import { scheduleMedicationReminders } from '../services/notification/reminder.service.js';

export const submitSymptoms = async (req, res, next) => {
  try {
    const { appointmentId, symptoms } = req.body;
    const patientId = req.user._id;

    if (!appointmentId || !symptoms) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'appointmentId and symptoms are required.',
        },
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Appointment not found.',
        },
      });
    }

    // Save initial symptom report
    const report = await SymptomReport.create({
      patientId,
      appointmentId,
      symptoms,
      aiStatus: 'PENDING',
    });

    // Link report to appointment
    appointment.symptomReportId = report._id;
    await appointment.save();

    // Trigger AI pipeline (Graceful failure handled internally)
    try {
      const aiSummary = await analyzeSymptoms(symptoms);
      report.aiSummary = aiSummary;
      report.aiStatus = 'COMPLETED';
      await report.save();
    } catch (aiError) {
      console.error(`AI Analysis failed for SymptomReport ${report._id}:`, aiError.message);
      report.aiStatus = 'FAILED';
      await report.save();
    }

    res.status(200).json({
      success: true,
      data: {
        symptomReport: report,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const submitVisitNotes = async (req, res, next) => {
  try {
    const { appointmentId, clinicalNotes, prescription } = req.body;
    const doctorId = req.user._id;

    if (!appointmentId || !clinicalNotes) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'appointmentId and clinicalNotes are required.',
        },
      });
    }

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Appointment not found.',
        },
      });
    }

    // Save initial visit note
    const visitNote = await VisitNote.create({
      appointmentId,
      doctorId,
      clinicalNotes,
      prescription: prescription || [],
      aiStatus: 'PENDING',
    });

    // Link note to appointment
    appointment.visitNoteId = visitNote._id;
    appointment.status = 'COMPLETED'; // Marking appointment completed
    await appointment.save();

    // Trigger AI summary transformation
    try {
      const patientSummary = await summarizeVisit(clinicalNotes, prescription || []);
      visitNote.patientSummary = patientSummary;
      visitNote.aiStatus = 'COMPLETED';
      await visitNote.save();

      // Schedule medication reminders dynamically from prescription elements
      await scheduleMedicationReminders(appointment.patientId, appointment._id, prescription || []);
    } catch (aiError) {
      console.error(`AI Summary failed for VisitNote ${visitNote._id}:`, aiError.message);
      visitNote.aiStatus = 'FAILED';
      await visitNote.save();
    }

    res.status(200).json({
      success: true,
      data: {
        visitNote,
      },
    });
  } catch (error) {
    next(error);
  }
};
