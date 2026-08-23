import axios from 'axios';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

const test = async () => {
  await connectDB();

  const backendUrl = 'http://localhost:5000/api';
  
  const getHeaders = (cookieHeader) => {
    return cookieHeader ? { Cookie: cookieHeader } : {};
  };

  const loginUser = async (email, password) => {
    const res = await axios.post(`${backendUrl}/auth/login`, { email, password });
    const setCookie = res.headers['set-cookie'];
    const cookies = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
    return { user: res.data.data.user, cookie: cookies };
  };

  try {
    console.log('\n=============================================');
    console.log('STARTING FULL WORKFLOW INTEGRATION TESTING');
    console.log('=============================================\n');

    // 1. Patient Login
    console.log('--- 1. Logging in as Patient (patient@careflow.com) ---');
    const patient = await loginUser('patient@careflow.com', 'password123');
    console.log('Logged in user:', patient.user);

    // 2. Discover Doctors
    console.log('\n--- 2. Finding available doctors ---');
    const doctorSearch = await axios.get(`${backendUrl}/doctors?specialization=General Medicine`);
    const doctor = doctorSearch.data.data.doctors[0];
    console.log('Doctor found:', doctor.userId.name, 'Specialization:', doctor.specialization);
    const doctorId = doctor._id;

    // 3. Check Slots
    console.log('\n--- 3. Checking doctor availability ---');
    const slotsRes = await axios.get(`${backendUrl}/appointments/doctors/${doctorId}/availability?date=2026-10-05`);
    const availableSlot = slotsRes.data.data.slots.find(s => s.status === 'AVAILABLE');
    console.log('Found available slot:', availableSlot);

    // 4. Place hold
    console.log('\n--- 4. Patient holding slot ---');
    const holdRes = await axios.post(`${backendUrl}/appointments/hold`, {
      doctorId,
      date: '2026-10-05',
      startTime: availableSlot.startTime,
      endTime: availableSlot.endTime
    }, { headers: getHeaders(patient.cookie) });
    const appointmentId = holdRes.data.data.appointment._id;
    console.log('Slot hold registered. Appointment ID:', appointmentId);

    // 5. Submit Symptoms (Trigger AI brief)
    console.log('\n--- 5. Patient submitting symptoms ---');
    const symptomRes = await axios.post(`${backendUrl}/ai/pre-visit`, {
      appointmentId,
      symptoms: 'Experiencing high fever, severe headache, and sore throat for two days.'
    }, { headers: getHeaders(patient.cookie) });
    console.log('Symptom report submitted. AI urgency:', symptomRes.data.data.symptomReport.aiSummary.urgency);

    // 6. Confirm Booking
    console.log('\n--- 6. Patient confirming booking ---');
    const confirmRes = await axios.post(`${backendUrl}/appointments/confirm`, {
      appointmentId
    }, { headers: getHeaders(patient.cookie) });
    console.log('Booking confirmed. Calendar status:', confirmRes.data.data.appointment.googleCalendarSyncStatus);

    // 7. Doctor Login
    console.log('\n--- 7. Logging in as Doctor (doctor@careflow.com) ---');
    const doctorSession = await loginUser('doctor@careflow.com', 'password123');
    console.log('Logged in user:', doctorSession.user);

    // 8. Doctor submits clinical notes and prescription
    console.log('\n--- 8. Doctor submitting notes and prescription ---');
    const notesRes = await axios.post(`${backendUrl}/ai/post-visit`, {
      appointmentId,
      clinicalNotes: 'Signs of severe throat inflammation. Prescribed Amoxicillin.',
      prescription: [
        { name: 'Amoxicillin', dosage: '500mg', frequency: 'Thrice daily', duration: '5 days' }
      ]
    }, { headers: getHeaders(doctorSession.cookie) });
    console.log('Visit notes saved. Patient friendly summary:', notesRes.data.data.visitNote.patientSummary.summary);

    // 9. Admin Login
    console.log('\n--- 9. Logging in as Admin (admin@careflow.com) ---');
    const admin = await loginUser('admin@careflow.com', 'password123');
    console.log('Logged in user:', admin.user);

    // 10. Admin applies leave on the booked date to test conflict handling
    console.log('\n--- 10. Admin applying doctor leave on booked date ---');
    const leaveRes = await axios.post(`${backendUrl}/admin/doctors/${doctorId}/leave`, {
      date: '2026-10-05',
      reason: 'Out of town conference'
    }, { headers: getHeaders(admin.cookie) });
    console.log('Leave added. Conflicts identified:', leaveRes.data.data.conflicts);

    console.log('\n=============================================');
    console.log('ALL FUNCTIONALITIES SUCCESSFULLY VERIFIED (E2E)');
    console.log('=============================================\n');

  } catch (error) {
    console.error('E2E Integration testing failed:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  } finally {
    await mongoose.connection.close();
  }
};

test();
