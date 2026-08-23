import Appointment from '../../models/Appointment.js';
import Doctor from '../../models/Doctor.js';
import Leave from '../../models/Leave.js';

export const holdSlot = async (patientId, doctorId, dateStr, startTime, endTime) => {
  // Validate doctor profile
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    const error = new Error('Doctor profile not found.');
    error.statusCode = 404;
    error.errorCode = 'DOCTOR_NOT_FOUND';
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
  const holdExpiresAt = new Date(now.getTime() + 5 * 60 * 1000); // 5 minutes hold

  try {
    const appointment = await Appointment.create({
      doctorId,
      patientId,
      date: searchDate,
      startTime,
      endTime,
      status: 'HELD',
      holdExpiresAt,
    });
    return appointment;
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

export const confirmBooking = async (appointmentId, patientId) => {
  const appointment = await Appointment.findById(appointmentId);
  if (!appointment) {
    const error = new Error('Appointment not found.');
    error.statusCode = 404;
    error.errorCode = 'APPOINTMENT_NOT_FOUND';
    throw error;
  }

  if (appointment.patientId.toString() !== patientId.toString()) {
    const error = new Error('Forbidden.');
    error.statusCode = 403;
    error.errorCode = 'FORBIDDEN';
    throw error;
  }

  if (appointment.status === 'CONFIRMED') {
    return appointment;
  }

  if (appointment.status !== 'HELD') {
    const error = new Error('This slot hold is invalid or has expired.');
    error.statusCode = 400;
    error.errorCode = 'SLOT_HOLD_EXPIRED';
    throw error;
  }

  if (new Date() > appointment.holdExpiresAt) {
    appointment.status = 'EXPIRED';
    await appointment.save();
    const error = new Error('The slot hold reservation has expired.');
    error.statusCode = 400;
    error.errorCode = 'SLOT_HOLD_EXPIRED';
    throw error;
  }

  appointment.status = 'CONFIRMED';
  appointment.holdExpiresAt = undefined;
  await appointment.save();

  return appointment;
};

export const releaseExpiredHolds = async () => {
  const now = new Date();
  const res = await Appointment.updateMany(
    {
      status: 'HELD',
      holdExpiresAt: { $lte: now },
    },
    { $set: { status: 'EXPIRED' } }
  );
  return res.modifiedCount;
};
