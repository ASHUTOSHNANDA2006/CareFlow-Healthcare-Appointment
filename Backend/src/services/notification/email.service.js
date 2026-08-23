import nodemailer from 'nodemailer';
import { config } from '../../config/env.js';

let transporter = null;

// Initialize Nodemailer SMTP Transporter if configured
if (config.emailUser && config.emailUser !== 'placeholder_email_user') {
  transporter = nodemailer.createTransport({
    host: config.emailHost,
    port: Number(config.emailPort),
    auth: {
      user: config.emailUser,
      pass: config.emailPassword,
    },
  });
  console.log('Nodemailer SMTP Transporter successfully configured.');
} else {
  console.warn('Warning: Nodemailer credentials are not configured. Emails will write mock logs.');
}

const buildTemplate = (type, details) => {
  const templates = {
    BOOKING_CONFIRMATION: {
      subject: 'CareFlow - Appointment Booking Confirmed',
      html: `<h3>Your appointment is confirmed!</h3>
             <p>Hi ${details.patientName},</p>
             <p>Your appointment with Doctor is confirmed for <strong>${details.date}</strong> starting at <strong>${details.startTime}</strong>.</p>
             <p>Thank you for choosing CareFlow.</p>`,
    },
    CANCELLATION: {
      subject: 'CareFlow - Appointment Cancelled',
      html: `<h3>Your appointment has been cancelled</h3>
             <p>Hi ${details.patientName},</p>
             <p>Your appointment on <strong>${details.date}</strong> at <strong>${details.startTime}</strong> has been cancelled.</p>`,
    },
    RESCHEDULE: {
      subject: 'CareFlow - Appointment Rescheduled',
      html: `<h3>Your appointment has been rescheduled</h3>
             <p>Hi ${details.patientName},</p>
             <p>Your appointment has been updated to <strong>${details.date}</strong> at <strong>${details.startTime}</strong>.</p>`,
    },
    DOCTOR_LEAVE_CONFLICT: {
      subject: 'CareFlow Alert - Rescheduling Required',
      html: `<h3>Appointment Alert: Doctor Unavailable</h3>
             <p>Hi ${details.patientName},</p>
             <p>Your appointment on <strong>${details.date}</strong> at <strong>${details.startTime}</strong> needs to be rescheduled because the doctor is unavailable on this date (${details.reason}).</p>
             <p>Please log in to your dashboard to select another slot.</p>`,
    },
    MEDICATION_REMINDER: {
      subject: 'CareFlow Medication Reminder',
      html: `<h3>Medication Reminder</h3>
             <p>Hi ${details.patientName},</p>
             <p>It is time to take your medication: <strong>${details.medicationName}</strong> (${details.dosage}) - <strong>${details.frequency}</strong>.</p>
             <p>Instructions: ${details.duration}. Please follow your doctor's instructions.</p>`,
    },
  };

  return templates[type] || { subject: 'CareFlow Notification', html: `<p>CareFlow update received.</p>` };
};

export const sendEmail = async (email, type, details) => {
  const { subject, html } = buildTemplate(type, details);

  if (!transporter) {
    console.log(`[Mock Email Triggered] Sent ${type} to ${email}. Subject: "${subject}". details:`, details);
    return true; // Return true as a successful mock write
  }

  const mailOptions = {
    from: config.emailFrom || 'noreply@careflow.com',
    to: email,
    subject,
    html,
  };

  await transporter.sendMail(mailOptions);
  console.log(`[Email Sent successfully] ${type} sent to ${email}`);
  return true;
};
