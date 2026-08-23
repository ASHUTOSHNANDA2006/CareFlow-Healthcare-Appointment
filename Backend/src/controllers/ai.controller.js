import SymptomReport from '../models/SymptomReport.js';
import VisitNote from '../models/VisitNote.js';
import Appointment from '../models/Appointment.js';
import Doctor from '../models/Doctor.js';
import Notification from '../models/Notification.js';
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

    // Verify ownership
    if (appointment.patientId.toString() !== patientId.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to submit symptoms for this appointment.',
        },
      });
    }

    // Save initial report document
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
    const { appointmentId, clinicalNotes, diagnosis, followUp, prescription } = req.body;
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
      diagnosis: diagnosis || '',
      followUp: followUp || '',
      prescription: prescription || [],
      aiStatus: 'PENDING',
    });

    // Link note to appointment & update status to COMPLETED
    appointment.visitNoteId = visitNote._id;
    appointment.status = 'COMPLETED';
    await appointment.save();

    // Create consultation completion notification
    await Notification.create({
      recipientId: appointment.patientId,
      appointmentId: appointment._id,
      type: 'CONSULTATION_COMPLETED',
      metadata: {
        date: appointment.date.toISOString().split('T')[0],
        diagnosis: diagnosis || 'General Consultation',
      },
    });

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

export const updateVisitNotes = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { clinicalNotes, diagnosis, followUp, prescription } = req.body;

    const visitNote = await VisitNote.findById(id);
    if (!visitNote) {
      return res.status(404).json({
        success: false,
        error: { code: 'VISIT_NOTE_NOT_FOUND', message: 'Visit note not found.' },
      });
    }

    // Role check: Attending doctor or Admin can update consultation notes
    if (req.user.role === 'doctor') {
      if (visitNote.doctorId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    }

    if (clinicalNotes !== undefined) visitNote.clinicalNotes = clinicalNotes;
    if (diagnosis !== undefined) visitNote.diagnosis = diagnosis;
    if (followUp !== undefined) visitNote.followUp = followUp;
    if (prescription !== undefined) visitNote.prescription = prescription;

    await visitNote.save();

    // Re-run post-visit AI summary if clinical notes or prescriptions were updated
    try {
      const patientSummary = await summarizeVisit(visitNote.clinicalNotes, visitNote.prescription || []);
      visitNote.patientSummary = patientSummary;
      visitNote.aiStatus = 'COMPLETED';
      await visitNote.save();
    } catch (aiErr) {
      console.error('Failed to update AI summary on visit note update:', aiErr.message);
    }

    res.status(200).json({
      success: true,
      data: { visitNote },
    });
  } catch (error) {
    next(error);
  }
};
