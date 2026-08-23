import Doctor from '../../models/Doctor.js';
import Leave from '../../models/Leave.js';
import Appointment from '../../models/Appointment.js';
import SlotHold from '../../models/SlotHold.js';

// Formats minutes as HH:MM
const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Parses HH:MM to minutes
const parseTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

export const getDoctorSlotsForDate = async (doctorId, dateStr) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error('Doctor profile not found.');
  }

  // 1. Check if doctor is on leave
  const searchDate = new Date(dateStr);
  searchDate.setUTCHours(0, 0, 0, 0);
  const leave = await Leave.findOne({ doctorId, date: searchDate });
  if (leave) {
    return [];
  }

  // 2. Generate all working slots
  const slots = [];
  const startMinutes = parseTime(doctor.workingHours.start);
  const endMinutes = parseTime(doctor.workingHours.end);
  const duration = doctor.slotDuration;

  let current = startMinutes;
  while (current + duration <= endMinutes) {
    slots.push({
      startTime: formatTime(current),
      endTime: formatTime(current + duration),
    });
    current += duration;
  }

  // 3. Release any expired holds inline to update availability calculations dynamically
  const now = new Date();
  await SlotHold.updateMany(
    {
      doctorId,
      date: searchDate,
      status: 'HELD',
      expiresAt: { $lte: now },
    },
    { $set: { status: 'EXPIRED' } }
  );

  // Fetch active bookings
  const activeAppointments = await Appointment.find({
    doctorId,
    date: searchDate,
    status: { $in: ['CONFIRMED', 'COMPLETED'] },
  });

  // Fetch active holds
  const activeHolds = await SlotHold.find({
    doctorId,
    date: searchDate,
    status: 'HELD',
  });

  const bookedSlotsMap = new Map();
  activeAppointments.forEach((app) => {
    bookedSlotsMap.set(app.startTime, 'CONFIRMED');
  });
  activeHolds.forEach((hold) => {
    bookedSlotsMap.set(hold.startTime, 'HELD');
  });

  return slots.map((slot) => {
    const activeStatus = bookedSlotsMap.get(slot.startTime);
    return {
      ...slot,
      status: activeStatus ? activeStatus : 'AVAILABLE',
    };
  });
};
