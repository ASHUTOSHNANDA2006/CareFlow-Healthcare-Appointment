import Notification from '../../models/Notification.js';

// Parses frequency strings to calculate times per day
const parseFrequencyTimes = (frequencyStr) => {
  const lower = frequencyStr.toLowerCase();
  if (lower.includes('thrice') || lower.includes('3 times')) return 3;
  if (lower.includes('twice') || lower.includes('2 times') || lower.includes('double')) return 2;
  return 1; // Default is once daily
};

// Parses duration strings to extract number of days
const parseDurationDays = (durationStr) => {
  const match = durationStr.match(/(\d+)\s*day/i);
  return match ? parseInt(match[1], 10) : 3; // Default is 3 days
};

export const scheduleMedicationReminders = async (patientId, appointmentId, prescriptionList) => {
  if (!prescriptionList || prescriptionList.length === 0) {
    return;
  }

  const now = new Date();
  const createdNotifications = [];

  for (const pres of prescriptionList) {
    const timesPerDay = parseFrequencyTimes(pres.frequency);
    const totalDays = parseDurationDays(pres.duration);

    // Generate scheduled notifications over the duration days
    for (let day = 0; day < totalDays; day++) {
      for (let timeIdx = 0; timeIdx < timesPerDay; timeIdx++) {
        // Offset reminder times throughout the days
        // Let's offset by 24h * day + (12h / timesPerDay) * timeIdx
        const hourOffset = (24 * day) + (12 / timesPerDay) * timeIdx;
        const scheduledFor = new Date(now.getTime() + hourOffset * 60 * 60 * 1000);

        const notification = await Notification.create({
          recipientId: patientId,
          appointmentId,
          type: 'MEDICATION_REMINDER',
          status: 'PENDING',
          scheduledFor,
          metadata: {
            medicationName: pres.name,
            dosage: pres.dosage,
            frequency: pres.frequency,
            duration: pres.duration,
          },
        });

        createdNotifications.push(notification);
      }
    }
  }

  console.log(`[Medication Reminders] Scheduled ${createdNotifications.length} reminder alerts for appointment ${appointmentId}`);
  return createdNotifications;
};
