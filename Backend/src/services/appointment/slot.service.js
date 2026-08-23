import Doctor from '../../models/Doctor.js';
import Leave from '../../models/Leave.js';
import Appointment from '../../models/Appointment.js';
import SlotHold from '../../models/SlotHold.js';

// Formats minutes as HH:MM
export const formatTime = (minutes) => {
  const h = Math.floor(minutes / 60).toString().padStart(2, '0');
  const m = (minutes % 60).toString().padStart(2, '0');
  return `${h}:${m}`;
};

// Parses HH:MM to minutes
export const parseTime = (timeStr) => {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
};

// Gets current date string (YYYY-MM-DD) and time string (HH:MM) in configured timezone
export const getNowInTimezone = (timeZone = process.env.APP_TIMEZONE || 'Asia/Kolkata') => {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-CA', { timeZone }); // YYYY-MM-DD
  const timeStr = now.toLocaleTimeString('en-GB', { timeZone, hour: '2-digit', minute: '2-digit', hour12: false });
  return { dateStr, timeStr, now };
};

export const getDoctorSlotsForDate = async (doctorId, dateStr, customNow = null) => {
  const doctor = await Doctor.findById(doctorId);
  if (!doctor) {
    throw new Error('Doctor profile not found.');
  }

  const { dateStr: currentDateStr, timeStr: currentTimeStr } = customNow || getNowInTimezone();
  const currentMinutes = parseTime(currentTimeStr);

  // 1. Check if doctor is on leave
  const searchDate = new Date(dateStr);
  searchDate.setUTCHours(0, 0, 0, 0);
  const leave = await Leave.findOne({ doctorId, date: searchDate });
  if (leave) {
    return [];
  }

  // 2. If selected date is in the past, return zero slots
  if (dateStr < currentDateStr) {
    return [];
  }

  // 3. Generate all working slots
  const slots = [];
  const startMinutes = parseTime(doctor.workingHours.start);
  const endMinutes = parseTime(doctor.workingHours.end);
  const duration = doctor.slotDuration;

  let current = startMinutes;
  while (current + duration <= endMinutes) {
    const startTime = formatTime(current);
    const endTime = formatTime(current + duration);

    // If selected date is TODAY, exclude slots whose start time has already passed
    if (dateStr === currentDateStr) {
      if (current >= currentMinutes) {
        slots.push({ startTime, endTime });
      }
    } else {
      // Future date: include all working slots
      slots.push({ startTime, endTime });
    }

    current += duration;
  }

  // 4. Release any expired holds inline to update availability calculations dynamically
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
