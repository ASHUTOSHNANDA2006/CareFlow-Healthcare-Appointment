import Appointment from '../../models/Appointment.js';
import User from '../../models/User.js';

export const handleLeaveConflicts = async (doctorId, dateStr, reason) => {
  const leaveDate = new Date(dateStr);
  leaveDate.setUTCHours(0, 0, 0, 0);

  // Find all active affected appointments
  const affectedAppointments = await Appointment.find({
    doctorId,
    date: leaveDate,
    status: { $in: ['HELD', 'CONFIRMED'] },
  }).populate('patientId', 'name email');

  if (affectedAppointments.length === 0) {
    return { affectedCount: 0, conflicts: [] };
  }

  // Update status to CANCELLED instead of silently deleting
  await Appointment.updateMany(
    {
      doctorId,
      date: leaveDate,
      status: { $in: ['HELD', 'CONFIRMED'] },
    },
    { $set: { status: 'CANCELLED' } }
  );

  // Prepare conflict reports (will be integrated with notifications in Milestone 6)
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
