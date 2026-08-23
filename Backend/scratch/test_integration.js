import axios from 'axios';
import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import Appointment from '../src/models/Appointment.js';
import Notification from '../src/models/Notification.js';
import Leave from '../src/models/Leave.js';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';
import { processNotifications } from '../src/services/notification/retry.service.js';

const test = async () => {
  await connectDB();

  // Clear data
  await User.deleteMany({ email: { $in: ['int_admin@test.com', 'int_doctor@test.com', 'int_patient@test.com'] } });
  await Appointment.deleteMany({});
  await Notification.deleteMany({});
  await Leave.deleteMany({});
  await Doctor.deleteMany({});

  const backendUrl = 'http://localhost:5000/api';

  const registerUser = async (name, email, password, role) => {
    const res = await axios.post(`${backendUrl}/auth/register`, { name, email, password, role });
    const setCookie = res.headers['set-cookie'];
    const cookies = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
    return { user: res.data.data.user, headers: { Cookie: cookies } };
  };

  try {
    console.log('\n--- 1. Setting up Users ---');
    const admin = await registerUser('Int Admin', 'int_admin@test.com', 'password', 'admin');
    const patient = await registerUser('Int Patient', 'int_patient@test.com', 'password', 'patient');

    // Create doctor profile
    const docRes = await axios.post(`${backendUrl}/admin/doctors`, {
      name: 'Dr. Gregory',
      email: 'int_doctor@test.com',
      password: 'password',
      specialization: 'Neurology',
      qualification: 'MBBS, MD',
      experience: 18,
      slotDuration: 30,
      workingHours: { start: '09:00', end: '17:00' }
    }, { headers: admin.headers });
    const doctorId = docRes.data.data.doctor.id;

    // Log in the doctor
    const doctorLoginRes = await axios.post(`${backendUrl}/auth/login`, {
      email: 'int_doctor@test.com',
      password: 'password'
    });
    const docCookie = doctorLoginRes.headers['set-cookie'] ? doctorLoginRes.headers['set-cookie'].map(c => c.split(';')[0]).join('; ') : '';
    const doctorHeaders = { Cookie: docCookie };

    console.log('\n--- 2. Booking confirmed appointment ---');
    const holdRes = await axios.post(`${backendUrl}/appointments/hold`, {
      doctorId,
      date: '2026-09-20',
      startTime: '11:00',
      endTime: '11:30'
    }, { headers: patient.headers });
    const appointmentId = holdRes.data.data.appointment._id;

    const confirmRes = await axios.post(`${backendUrl}/appointments/confirm`, {
      appointmentId
    }, { headers: patient.headers });
    
    console.log('Booking Confirmed. Calendar status:', confirmRes.data.data.appointment.googleCalendarSyncStatus);
    console.log('Calendar event ID:', confirmRes.data.data.appointment.googleCalendarEventId);

    console.log('\n--- 3. Verify confirmation notification queued ---');
    const queuedNotif = await Notification.findOne({ appointmentId, type: 'BOOKING_CONFIRMATION' });
    if (queuedNotif) {
      console.log('PASS: Booking confirmation notification is correctly queued (Status:', queuedNotif.status, ')');
    } else {
      console.error('FAIL: Booking confirmation notification missing.');
    }

    console.log('\n--- 4. Complete visit and verify medication reminders scheduled ---');
    const notesRes = await axios.post(`${backendUrl}/ai/post-visit`, {
      appointmentId,
      clinicalNotes: 'Follow general guidelines. Prescribed Aspirin.',
      prescription: [
        { name: 'Aspirin', dosage: '100mg', frequency: 'Twice daily', duration: '3 days' }
      ]
    }, { headers: doctorHeaders });

    console.log('Doctor Notes Submitted.');
    const reminderCount = await Notification.countDocuments({ appointmentId, type: 'MEDICATION_REMINDER' });
    console.log('Scheduled Medication Reminders Count:', reminderCount);
    // Twice daily * 3 days = 6 scheduled reminders
    if (reminderCount === 6) {
      console.log('PASS: Scheduled correct number of reminders based on frequency.');
    } else {
      console.error('FAIL: Expected 6 reminders, found:', reminderCount);
    }

    console.log('\n--- 5. Trigger notification queue processing manually ---');
    await processNotifications();
    
    const sentConfirmation = await Notification.findOne({ appointmentId, type: 'BOOKING_CONFIRMATION' });
    console.log('Processed confirmation notification status:', sentConfirmation.status);
    if (sentConfirmation.status === 'SENT') {
      console.log('PASS: Worker successfully processed and cleared pending email.');
    } else {
      console.error('FAIL: Notification processing failed to send email.');
    }

  } catch (error) {
    console.error('Test execution failed:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  } finally {
    await mongoose.connection.close();
  }
};

test();
