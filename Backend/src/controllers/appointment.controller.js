import Appointment from '../models/Appointment.js';
import Notification from '../models/Notification.js';
import Doctor from '../models/Doctor.js';
import Leave from '../models/Leave.js';
import { getDoctorSlotsForDate, getNowInTimezone } from '../services/appointment/slot.service.js';
import { holdSlot, confirmBooking } from '../services/appointment/booking.service.js';
import { syncGoogleCalendarEvent } from '../services/calendar/googleCalendar.service.js';

export const getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id)
      .populate({ path: 'doctorId', select: 'specialization workingHours slotDuration', populate: { path: 'userId', select: 'name email' } })
      .populate('patientId', 'name email')
      .populate('symptomReportId')
      .populate('visitNoteId');

    if (!appointment) {
      return res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: 'Appointment not found.' } });
    }

    // Authorization: patients can only see their own; doctors can only see theirs
    if (req.user.role === 'patient' && appointment.patientId._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    }
    if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (!doctorProfile || appointment.doctorId._id.toString() !== doctorProfile._id.toString()) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      }
    }

    res.status(200).json({ success: true, data: { appointment } });
  } catch (error) {
    next(error);
  }
};

export const getNotifications = async (req, res, next) => {
  try {
    const notifications = await Notification.find({ recipientId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.status(200).json({ success: true, data: { notifications } });
  } catch (error) {
    next(error);
  }
};

export const markNotificationRead = async (req, res, next) => {
  try {
    const { id } = req.params;
    const notification = await Notification.findOneAndUpdate(
      { _id: id, recipientId: req.user._id },
      { isRead: true },
      { new: true }
    );
    res.status(200).json({ success: true, data: { notification } });
  } catch (error) {
    next(error);
  }
};

export const markAllNotificationsRead = async (req, res, next) => {
  try {
    await Notification.updateMany({ recipientId: req.user._id, isRead: false }, { $set: { isRead: true } });
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

export const getAvailability = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date } = req.query;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Date is required.',
        },
      });
    }

    const { dateStr: currentDateStr } = getNowInTimezone();
    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    const leave = await Leave.findOne({ doctorId, date: searchDate });
    if (leave) {
      return res.status(200).json({
        success: true,
        data: {
          available: false,
          reason: 'DOCTOR_ON_LEAVE',
          slots: [],
        },
      });
    }

    if (date < currentDateStr) {
      return res.status(200).json({
        success: true,
        data: {
          available: false,
          reason: 'PAST_DATE',
          slots: [],
        },
      });
    }

    const slots = await getDoctorSlotsForDate(doctorId, date);
    res.status(200).json({
      success: true,
      data: {
        available: true,
        reason: null,
        slots,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const holdAppointmentSlot = async (req, res, next) => {
  try {
    const { doctorId, date, startTime, endTime } = req.body;
    const patientId = req.user._id;

    if (!doctorId || !date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'doctorId, date, startTime, and endTime are required.',
        },
      });
    }

    const hold = await holdSlot(patientId, doctorId, date, startTime, endTime);

    res.status(201).json({
      success: true,
      data: {
        slotHold: hold,
        appointment: hold,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const confirmAppointment = async (req, res, next) => {
  try {
    const { slotHoldId } = req.body;
    const patientId = req.user._id;

    if (!slotHoldId) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'slotHoldId is required.',
        },
      });
    }

    const confirmed = await confirmBooking(slotHoldId, patientId);

    // Queue booking confirmation notification
    await Notification.create({
      recipientId: patientId,
      appointmentId: confirmed._id,
      type: 'BOOKING_CONFIRMATION',
      metadata: {
        date: confirmed.date.toISOString().split('T')[0],
        startTime: confirmed.startTime,
      },
    });

    // Synchronize Google Calendar Event (Failure does not break booking transaction status)
    try {
      const syncResult = await syncGoogleCalendarEvent(confirmed, 'CREATE');
      confirmed.googleCalendarEventId = syncResult.eventId;
      confirmed.googleCalendarSyncStatus = 'SYNCED';
      await confirmed.save();
    } catch (calendarError) {
      console.error('[Google Calendar confirm sync error]:', calendarError.message);
      confirmed.googleCalendarSyncStatus = 'FAILED';
      await confirmed.save();
    }

    res.status(200).json({
      success: true,
      data: {
        appointment: confirmed,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getAppointments = async (req, res, next) => {
  try {
    const query = {};
    if (req.user.role === 'patient') {
      query.patientId = req.user._id;
    } else if (req.user.role === 'doctor') {
      // Appointments store the Doctor profile _id (not the User _id)
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (!doctorProfile) {
        return res.status(404).json({
          success: false,
          error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' },
        });
      }
      query.doctorId = doctorProfile._id;
    }
    // Admins get all appointments (no filter)

    const appointments = await Appointment.find(query)
      .populate({ path: 'doctorId', select: 'specialization workingHours', populate: { path: 'userId', select: 'name email' } })
      .populate('patientId', 'name email')
      .sort({ date: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      data: {
        appointments,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateAppointmentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;

    const allowed = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED', 'REJECTED'];
    if (!status || !allowed.includes(status)) {
      return res.status(400).json({
        success: false,
        error: { code: 'VALIDATION_ERROR', message: `Status must be one of: ${allowed.join(', ')}` },
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: { code: 'APPOINTMENT_NOT_FOUND', message: 'Appointment not found.' },
      });
    }

    // Role check: Patients can cancel own; Doctors can manage assigned; Admins can manage any
    if (req.user.role === 'patient') {
      if (appointment.patientId.toString() !== req.user._id.toString()) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      }
      if (status !== 'CANCELLED') {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Patients can only cancel appointments.' } });
      }
    } else if (req.user.role === 'doctor') {
      const doctorProfile = await Doctor.findOne({ userId: req.user._id });
      if (!doctorProfile || appointment.doctorId.toString() !== doctorProfile._id.toString()) {
        return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
      }
    } else if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: 'Access denied.' } });
    }

    // State machine transition validation
    const currentStatus = appointment.status;
    const validTransitions = {
      PENDING: ['CONFIRMED', 'REJECTED', 'CANCELLED'],
      CONFIRMED: ['COMPLETED', 'CANCELLED', 'REJECTED'],
      COMPLETED: [],
      CANCELLED: [],
      REJECTED: [],
    };

    if (currentStatus !== status && (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status))) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_STATE_TRANSITION',
          message: `Cannot transition appointment from ${currentStatus} to ${status}.`,
        },
      });
    }

    appointment.status = status;
    await appointment.save();

    // Map status transition to notification type
    let notifType = 'BOOKING_CONFIRMATION';
    if (status === 'CONFIRMED') notifType = 'APPOINTMENT_ACCEPTED';
    else if (status === 'REJECTED') notifType = 'APPOINTMENT_REJECTED';
    else if (status === 'CANCELLED') notifType = 'CANCELLATION';
    else if (status === 'COMPLETED') notifType = 'CONSULTATION_COMPLETED';

    // Recipient selection
    const recipientId = (req.user.role === 'patient') ? appointment.doctorId : appointment.patientId;

    await Notification.create({
      recipientId: recipientId,
      appointmentId: appointment._id,
      type: notifType,
      metadata: {
        date: appointment.date.toISOString().split('T')[0],
        startTime: appointment.startTime,
        status: status,
        reason: reason || '',
      },
    });

    res.status(200).json({ success: true, data: { appointment } });
  } catch (error) {
    next(error);
  }
};

export const cancelAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);

    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Appointment not found.',
        },
      });
    }

    // Patients can cancel their own; admins/doctors can cancel any
    if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to cancel this appointment.',
        },
      });
    }

    appointment.status = 'CANCELLED';
    await appointment.save();

    // Queue cancellation notification
    await Notification.create({
      recipientId: appointment.patientId,
      appointmentId: appointment._id,
      type: 'CANCELLATION',
      metadata: {
        date: appointment.date.toISOString().split('T')[0],
        startTime: appointment.startTime,
      },
    });

    // Delete Google Calendar Event
    try {
      await syncGoogleCalendarEvent(appointment, 'DELETE');
      appointment.googleCalendarSyncStatus = 'SYNCED';
      await appointment.save();
    } catch (calendarError) {
      console.error('[Google Calendar cancel sync error]:', calendarError.message);
      appointment.googleCalendarSyncStatus = 'FAILED';
      await appointment.save();
    }

    res.status(200).json({
      success: true,
      data: {
        appointment,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const rescheduleAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { date, startTime, endTime } = req.body;

    if (!date || !startTime || !endTime) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'date, startTime, and endTime are required.',
        },
      });
    }

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'APPOINTMENT_NOT_FOUND',
          message: 'Appointment not found.',
        },
      });
    }

    if (req.user.role === 'patient' && appointment.patientId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You are not authorized to reschedule this appointment.',
        },
      });
    }

    const searchDate = new Date(date);
    searchDate.setUTCHours(0, 0, 0, 0);

    // Update appointment parameters securely ensuring unique partial filters trigger
    appointment.date = searchDate;
    appointment.startTime = startTime;
    appointment.endTime = endTime;
    appointment.status = 'CONFIRMED'; // Reschedules automatically lock confirmed status

    try {
      await appointment.save();
      
      // Queue Reschedule Notification
      await Notification.create({
        recipientId: appointment.patientId,
        appointmentId: appointment._id,
        type: 'RESCHEDULE',
        metadata: {
          date: date,
          startTime: startTime,
        },
      });

      // Synchronize Google Calendar Event
      try {
        await syncGoogleCalendarEvent(appointment, 'UPDATE');
        appointment.googleCalendarSyncStatus = 'SYNCED';
        await appointment.save();
      } catch (calendarError) {
        console.error('[Google Calendar reschedule sync error]:', calendarError.message);
        appointment.googleCalendarSyncStatus = 'FAILED';
        await appointment.save();
      }
    } catch (err) {
      if (err.code === 11000) {
        return res.status(409).json({
          success: false,
          error: {
            code: 'SLOT_UNAVAILABLE',
            message: 'The requested slot is already booked.',
          },
        });
      }
      throw err;
    }

    res.status(200).json({
      success: true,
      data: {
        appointment,
      },
    });
  } catch (error) {
    next(error);
  }
};
