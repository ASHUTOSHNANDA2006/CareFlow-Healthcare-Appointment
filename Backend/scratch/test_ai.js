import axios from 'axios';
import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import Appointment from '../src/models/Appointment.js';
import SymptomReport from '../src/models/SymptomReport.js';
import VisitNote from '../src/models/VisitNote.js';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

const test = async () => {
  await connectDB();

  // Clear data
  await User.deleteMany({ email: { $in: ['ai_admin@test.com', 'ai_doctor@test.com', 'ai_patient@test.com'] } });
  await Doctor.deleteMany({});
  await Appointment.deleteMany({});
  await SymptomReport.deleteMany({});
  await VisitNote.deleteMany({});

  const backendUrl = 'http://localhost:5000/api';

  const registerUser = async (name, email, password, role) => {
    const res = await axios.post(`${backendUrl}/auth/register`, { name, email, password, role });
    const setCookie = res.headers['set-cookie'];
    const cookies = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
    return { user: res.data.data.user, headers: { Cookie: cookies } };
  };

  try {
    console.log('\n--- 1. Setting up Users ---');
    const admin = await registerUser('AI Admin', 'ai_admin@test.com', 'password', 'admin');
    const patient = await registerUser('AI Patient', 'ai_patient@test.com', 'password', 'patient');
    // Create doctor profile
    const docRes = await axios.post(`${backendUrl}/admin/doctors`, {
      name: 'Dr. Smith',
      email: 'ai_doctor@test.com',
      password: 'password',
      specialization: 'Pediatrics',
      qualification: 'MBBS, MD',
      experience: 15,
      slotDuration: 30,
      workingHours: { start: '09:00', end: '17:00' }
    }, { headers: admin.headers });
    const doctorId = docRes.data.data.doctor.id;

    // Log in the doctor to get headers
    const doctorLoginRes = await axios.post(`${backendUrl}/auth/login`, {
      email: 'ai_doctor@test.com',
      password: 'password'
    });
    const setCookie = doctorLoginRes.headers['set-cookie'];
    const doctorCookies = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
    const doctorHeaders = { Cookie: doctorCookies };

    // Place slot hold and confirm to create active appointment
    const holdRes = await axios.post(`${backendUrl}/appointments/hold`, {
      doctorId,
      date: '2026-09-15',
      startTime: '10:00',
      endTime: '10:30'
    }, { headers: patient.headers });
    const appointmentId = holdRes.data.data.appointment._id;

    await axios.post(`${backendUrl}/appointments/confirm`, {
      appointmentId
    }, { headers: patient.headers });

    console.log('\n--- 2. Patient submits Symptoms (Trigger Pre-Visit AI) ---');
    const symptomRes = await axios.post(`${backendUrl}/ai/pre-visit`, {
      appointmentId,
      symptoms: 'I have had a high fever for 3 days, body aches, chills, and a dry cough.'
    }, { headers: patient.headers });
    console.log('Symptom Submission Status:', symptomRes.status);
    console.log('AI status logged:', symptomRes.data.data.symptomReport.aiStatus);
    console.log('Extracted summary elements:', symptomRes.data.data.symptomReport.aiSummary);

    if (symptomRes.data.data.symptomReport.aiStatus === 'COMPLETED' || symptomRes.data.data.symptomReport.aiStatus === 'FAILED') {
      console.log('PASS: Symptom processing completed gracefully.');
    } else {
      console.error('FAIL: Symptom report AI state is invalid.');
    }

    console.log('\n--- 3. Doctor submits Clinical Notes (Trigger Post-Visit AI) ---');
    const noteRes = await axios.post(`${backendUrl}/ai/post-visit`, {
      appointmentId,
      clinicalNotes: 'Diagnosed with flu. Advised bed rest and plenty of fluids. Take Paracetamol for fever.',
      prescription: [
        { name: 'Paracetamol', dosage: '500mg', frequency: 'Twice daily', duration: '5 days' }
      ]
    }, { headers: doctorHeaders });
    
    console.log('Note Submission Status:', noteRes.status);
    console.log('Post-visit AI status logged:', noteRes.data.data.visitNote.aiStatus);
    console.log('Patient friendly explanation:', noteRes.data.data.visitNote.patientSummary);

    if (noteRes.data.data.visitNote.aiStatus === 'COMPLETED' || noteRes.data.data.visitNote.aiStatus === 'FAILED') {
      console.log('PASS: Post-visit processing completed gracefully.');
    } else {
      console.error('FAIL: Post-visit note AI state is invalid.');
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
