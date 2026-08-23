import SlotHold from '../../models/SlotHold.js';
import Appointment from '../../models/Appointment.js';
import Doctor from '../../models/Doctor.js';
import Leave from '../../models/Leave.js';
import { getNowInTimezone, parseTime } from './slot.service.js';
import { syncGoogleCalendarEvent } from '../calendar/googleCalendar.service.js';

export const holdSlot = async (patientId, doctorId, dateStr, startTime, endTime) => {
  // Validate doctor profile
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    const error = new Error('Doctor profile not found.');
    error.statusCode = 404;
    error.errorCode = 'DOCTOR_NOT_FOUND';
    throw error;
  }

  // Validate past time slot (Time-aware availability rule)
  const { dateStr: currentDateStr, timeStr: currentTimeStr } = getNowInTimezone();
  const currentMins = parseTime(currentTimeStr);
  const slotStartMins = parseTime(startTime);

  if (dateStr < currentDateStr || (dateStr === currentDateStr && slotStartMins < currentMins)) {
    const error = new Error('This appointment time has already passed.');
    error.statusCode = 400;
    error.errorCode = 'PAST_TIME_SLOT';
    throw error;
  }

  // Validate doctor leave
  const searchDate = new Date(dateStr);
  searchDate.setUTCHours(0, 0, 0, 0);
  const leave = await Leave.findOne({ doctorId, date: searchDate });
  if (leave) {
    const error = new Error('Doctor is on leave on this date.');
    error.statusCode = 400;
    error.errorCode = 'DOCTOR_ON_LEAVE';
    throw error;
  }

  const now = new Date();
  const expiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes hold

  // Check if there is already a confirmed appointment for this slot
  const existingAppointment = await Appointment.findOne({
    doctorId,
    date: searchDate,
    startTime,
    status: { $in: ['CONFIRMED', 'COMPLETED'] }
  });

  if (existingAppointment) {
    const error = new Error('The selected slot is already booked.');
    error.statusCode = 409;
    error.errorCode = 'SLOT_UNAVAILABLE';
    throw error;
  }

  try {
    const hold = await SlotHold.create({
      doctorId,
      patientId,
      date: searchDate,
      startTime,
      endTime,
      status: 'HELD',
      expiresAt,
    });
    return hold;
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error('The selected appointment slot is no longer available.');
      err.statusCode = 409;
      err.errorCode = 'SLOT_UNAVAILABLE';
      throw err;
    }
    throw error;
  }
};

export const confirmBooking = async (slotHoldId, patientId) => {
  const hold = await SlotHold.findById(slotHoldId);
  if (!hold) {
    const error = new Error('Slot hold reservation not found.');
    error.statusCode = 404;
    error.errorCode = 'SLOT_HOLD_NOT_FOUND';
    throw error;
  }

  if (hold.patientId.toString() !== patientId.toString()) {
    const error = new Error('Forbidden.');
    error.statusCode = 403;
    error.errorCode = 'FORBIDDEN';
    throw error;
  }

  if (hold.status === 'CONFIRMED') {
    // If already confirmed, retrieve the corresponding appointment
    const app = await Appointment.findOne({ doctorId: hold.doctorId, date: hold.date, startTime: hold.startTime });
    return app;
  }

  if (hold.status !== 'HELD') {
    const error = new Error('This slot hold is invalid or has expired.');
    error.statusCode = 400;
    error.errorCode = 'SLOT_HOLD_EXPIRED';
    throw error;
  }

  if (new Date() > hold.expiresAt) {
    hold.status = 'EXPIRED';
    await hold.save();
    const error = new Error('The slot hold reservation has expired.');
    error.statusCode = 400;
    error.errorCode = 'SLOT_HOLD_EXPIRED';
    throw error;
  }

  // Validate past time slot before creating permanent appointment
  const { dateStr: currentDateStr, timeStr: currentTimeStr } = getNowInTimezone();
  const holdDateStr = hold.date.toISOString().split('T')[0];
  const holdStartMins = parseTime(hold.startTime);
  const currentMins = parseTime(currentTimeStr);

  if (holdDateStr < currentDateStr || (holdDateStr === currentDateStr && holdStartMins < currentMins)) {
    hold.status = 'EXPIRED';
    await hold.save();
    const error = new Error('This appointment time has already passed.');
    error.statusCode = 400;
    error.errorCode = 'PAST_TIME_SLOT';
    throw error;
  }

  // Create permanent appointment record using MongoDB atomic unique validation limits
  try {
    const appointment = await Appointment.create({
      doctorId: hold.doctorId,
      patientId: hold.patientId,
      date: hold.date,
      startTime: hold.startTime,
      endTime: hold.endTime,
      status: 'CONFIRMED',
    });

    hold.status = 'CONFIRMED';
    await hold.save();

    // Synchronize Google Calendar Event and save persistent event metadata
    try {
      const syncResult = await syncGoogleCalendarEvent(appointment, 'CREATE');
      appointment.googleCalendarEventId = syncResult.eventId;
      appointment.googleCalendarSyncStatus = 'SYNCED';
      await appointment.save();
    } catch (calendarErr) {
      console.error('[Google Calendar confirm sync error]:', calendarErr.message);
      appointment.googleCalendarSyncStatus = 'FAILED';
      await appointment.save();
    }

    return appointment;
  } catch (error) {
    if (error.code === 11000) {
      const err = new Error('The selected slot was already booked by another user.');
      err.statusCode = 409;
      err.errorCode = 'SLOT_UNAVAILABLE';
      throw err;
    }
    throw error;
  }
};

export const releaseExpiredHolds = async () => {
  const now = new Date();
  const res = await SlotHold.updateMany(
    {
      status: 'HELD',
      expiresAt: { $lte: now },
    },
    { $set: { status: 'EXPIRED' } }
  );
  return res.modifiedCount;
};
