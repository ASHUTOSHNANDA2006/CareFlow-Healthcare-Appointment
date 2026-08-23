import Appointment from '../../models/Appointment.js';
import User from '../../models/User.js';
import Notification from '../../models/Notification.js';

export const handleLeaveConflicts = async (doctorId, dateStr, reason) => {
  const leaveDate = new Date(dateStr);
  leaveDate.setUTCHours(0, 0, 0, 0);

  // Find all active affected appointments
  const affectedAppointments = await Appointment.find({
    doctorId,
    date: leaveDate,
    status: 'CONFIRMED',
  }).populate('patientId', 'name email');

  if (affectedAppointments.length === 0) {
    return { affectedCount: 0, conflicts: [] };
  }

  // Queue DOCTOR_LEAVE_CONFLICT notification records
  for (const app of affectedAppointments) {
    await Notification.create({
      recipientId: app.patientId._id,
      appointmentId: app._id,
      type: 'DOCTOR_LEAVE_CONFLICT',
      metadata: {
        date: dateStr,
        startTime: app.startTime,
        reason: reason || 'Doctor placed on leave',
      },
    });
  }

  // Update status to CANCELLED instead of silently deleting
  await Appointment.updateMany(
    {
      doctorId,
      date: leaveDate,
      status: 'CONFIRMED',
    },
    { $set: { status: 'CANCELLED' } }
  );

  // Prepare conflict reports
  const conflicts = affectedAppointments.map((app) => ({
    appointmentId: app._id,
    patientName: app.patientId.name,
    patientEmail: app.patientId.email,
    startTime: app.startTime,
    date: dateStr,
    reason: reason || 'Doctor placed on leave',
  }));

  console.log(`[Leave Conflicts] Affected appointments for date ${dateStr}:`, conflicts);

  return {
    affectedCount: affectedAppointments.length,
    conflicts,
  };
};
