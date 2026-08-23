import axios from 'axios';
import { connectDB } from '../src/config/db.js';
import User from '../src/models/User.js';
import Patient from '../src/models/Patient.js';
import Doctor from '../src/models/Doctor.js';
import SlotHold from '../src/models/SlotHold.js';
import Appointment from '../src/models/Appointment.js';
import SymptomReport from '../src/models/SymptomReport.js';
import VisitNote from '../src/models/VisitNote.js';
import BlacklistedToken from '../src/models/BlacklistedToken.js';
import Notification from '../src/models/Notification.js';
import mongoose from 'mongoose';

const test = async () => {
  await connectDB();

  const backendUrl = 'http://localhost:5000/api';
  const getHeaders = (cookieHeader) => cookieHeader ? { Cookie: cookieHeader } : {};

  const loginUser = async (email, password) => {
    const res = await axios.post(`${backendUrl}/auth/login`, { email, password });
    const setCookie = res.headers['set-cookie'];
    const cookies = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
    return { user: res.data.data.user, cookie: cookies };
  };

  try {
    console.log('\n=============================================');
    console.log('STARTING REAL_ATLAS E2E WORKFLOW INTEGRATION');
    console.log('=============================================\n');

    // Clean previous records
    console.log('Cleaning collections on Atlas...');
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});
    await SlotHold.deleteMany({});
    await Appointment.deleteMany({});
    await SymptomReport.deleteMany({});
    await VisitNote.deleteMany({});
    await BlacklistedToken.deleteMany({});
    await Notification.deleteMany({});

    // 1. Create Admin, Doctor, and 2 Patients
    console.log('--- 1. Creating Admin, Doctor, Patient A, Patient B ---');
    const hash = await User.hashPassword('password123');

    const adminUser = await User.create({
      name: 'CareFlow Administrator',
      email: 'admin@careflow.com',
      passwordHash: hash,
      role: 'admin'
    });

    const doctorUser = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'doctor@careflow.com',
      passwordHash: hash,
      role: 'doctor'
    });

    const doctor = await Doctor.create({
      userId: doctorUser._id,
      specialization: 'General Medicine',
      qualification: 'MBBS, MD',
      experience: 10,
      slotDuration: 30,
      workingHours: { start: '09:00', end: '17:00' }
    });

    const patientAUser = await User.create({
      name: 'Rahul Sharma',
      email: 'patienta@careflow.com',
      passwordHash: hash,
      role: 'patient'
    });
    const patientAProfile = await Patient.create({ userId: patientAUser._id });

    const patientBUser = await User.create({
      name: 'Amit Kumar',
      email: 'patientb@careflow.com',
      passwordHash: hash,
      role: 'patient'
    });
    const patientBProfile = await Patient.create({ userId: patientBUser._id });

    console.log('Accounts persisted. Doctor ID:', doctor._id, 'Patient A User ID:', patientAUser._id);

    // 2. Patient A login, check slots, hold slot, and submit symptoms
    console.log('\n--- 2. Booking Flow (Patient A) ---');
    const patientASession = await loginUser('patienta@careflow.com', 'password123');

    const availability = await axios.get(`${backendUrl}/appointments/doctors/${doctor._id}/availability?date=2026-10-05`);
    const targetSlot = availability.data.data.slots.find(s => s.status === 'AVAILABLE');
    console.log('Holding slot:', targetSlot.startTime);

    const holdRes = await axios.post(`${backendUrl}/appointments/hold`, {
      doctorId: doctor._id,
      date: '2026-10-05',
      startTime: targetSlot.startTime,
      endTime: targetSlot.endTime
    }, { headers: getHeaders(patientASession.cookie) });
    const slotHoldId = holdRes.data.data.appointment._id;
    console.log('SlotHold saved. Hold ID:', slotHoldId);

    // Confirm booking
    const confirmRes = await axios.post(`${backendUrl}/appointments/confirm`, {
      slotHoldId
    }, { headers: getHeaders(patientASession.cookie) });
    const appointmentId = confirmRes.data.data.appointment._id;
    console.log('Appointment confirmed. ID:', appointmentId);

    // Symptom Intake
    const symptomsRes = await axios.post(`${backendUrl}/ai/pre-visit`, {
      appointmentId,
      symptoms: 'Fever and throat pain for 3 days'
    }, { headers: getHeaders(patientASession.cookie) });
    console.log('SymptomReport saved. ID:', symptomsRes.data.data.symptomReport._id);

    // 3. Concurrency check (Patient B attempts the same slot)
    console.log('\n--- 3. Concurrency slot lock validation ---');
    const patientBSession = await loginUser('patientb@careflow.com', 'password123');
    try {
      await axios.post(`${backendUrl}/appointments/hold`, {
        doctorId: doctor._id,
        date: '2026-10-05',
        startTime: targetSlot.startTime,
        endTime: targetSlot.endTime
      }, { headers: getHeaders(patientBSession.cookie) });
      console.log('UNEXPECTED: Concurrency check failed (Patient B was allowed to book)');
    } catch (err) {
      console.log('EXPECTED SUCCESS: Concurrency check blocked Patient B with status:', err.response.status, err.response.data.error.code);
    }

    // 4. Doctor reads appointment & completes visit notes
    console.log('\n--- 4. Doctor consults and completes visit notes ---');
    const doctorSession = await loginUser('doctor@careflow.com', 'password123');
    const doctorAppList = await axios.get(`${backendUrl}/appointments`, { headers: getHeaders(doctorSession.cookie) });
    const matchApp = doctorAppList.data.data.appointments.find(a => a._id === appointmentId);
    console.log('Doctor retrieved Patient A appointment from Mongoose:', matchApp ? 'YES' : 'NO');

    const notesRes = await axios.post(`${backendUrl}/ai/post-visit`, {
      appointmentId,
      clinicalNotes: 'Inflammation found. Rest prescribed.',
      prescription: [{ name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '3 days' }]
    }, { headers: getHeaders(doctorSession.cookie) });
    console.log('Visit note saved. Visit ID:', notesRes.data.data.visitNote._id);

    // 5. Patient A retrieves complete medical history
    console.log('\n--- 5. Patient A retrieves complete medical history ---');
    const patientHistory = await axios.get(`${backendUrl}/appointments`, { headers: getHeaders(patientASession.cookie) });
    console.log('Patient A retrieved own appointments count:', patientHistory.data.data.appointments.length);

    // 6. Security boundary overrides check
    console.log('\n--- 6. Security authorization constraints check ---');
    try {
      await axios.get(`${backendUrl}/admin/doctors`, { headers: getHeaders(patientASession.cookie) });
      console.log('UNEXPECTED: Patient allowed to access admin routes');
    } catch (err) {
      console.log('EXPECTED SUCCESS: Patient admin access blocked with status:', err.response.status);
    }

    // 7. JWT Logout Blacklist checks
    console.log('\n--- 7. Logout JWT blacklist checks ---');
    await axios.post(`${backendUrl}/auth/logout`, {}, { headers: getHeaders(patientASession.cookie) });
    const blacklistVerify = await BlacklistedToken.findOne({ userId: patientAUser._id });
    console.log('BlacklistedToken document created in Atlas:', blacklistVerify ? 'YES' : 'NO');

    try {
      await axios.get(`${backendUrl}/appointments`, { headers: getHeaders(patientASession.cookie) });
      console.log('UNEXPECTED: Revoked token allowed access');
    } catch (err) {
      console.log('EXPECTED SUCCESS: Revoked session blocked with status:', err.response.status);
    }

    console.log('\n=============================================');
    console.log('ALL ATLAS REAL E2E VERIFICATIONS COMPLETE');
    console.log('=============================================\n');

  } catch (error) {
    console.error('Atlas verification failed:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  } finally {
    await mongoose.connection.close();
  }
};

test();
