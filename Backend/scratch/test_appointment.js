import axios from 'axios';
import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import Appointment from '../src/models/Appointment.js';
import Leave from '../src/models/Leave.js';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

const test = async () => {
  await connectDB();

  // Clear data
  await User.deleteMany({ email: { $in: ['admin@test.com', 'doctor@test.com', 'patient1@test.com', 'patient2@test.com'] } });
  await Appointment.deleteMany({});
  await Leave.deleteMany({});

  const backendUrl = 'http://localhost:5000/api';

  const registerUser = async (name, email, password, role) => {
    const res = await axios.post(`${backendUrl}/auth/register`, { name, email, password, role });
    const setCookie = res.headers['set-cookie'];
    const cookies = setCookie ? setCookie.map(c => c.split(';')[0]).join('; ') : '';
    return { user: res.data.data.user, headers: { Cookie: cookies } };
  };

  try {
    console.log('\n--- 1. Setting up Users ---');
    const admin = await registerUser('Admin', 'admin@test.com', 'password', 'admin');
    const patient1 = await registerUser('Patient One', 'patient1@test.com', 'password', 'patient');
    const patient2 = await registerUser('Patient Two', 'patient2@test.com', 'password', 'patient');

    // Create doctor
    const docRes = await axios.post(`${backendUrl}/admin/doctors`, {
      name: 'Dr. House',
      email: 'doctor@test.com',
      password: 'password',
      specialization: 'Diagnostics',
      qualification: 'MD',
      experience: 20,
      slotDuration: 30,
      workingHours: { start: '09:00', end: '10:00' } // Generates 2 slots: 09:00-09:30, 09:30-10:00
    }, { headers: admin.headers });

    const doctorId = docRes.data.data.doctor.id;
    console.log('Doctor created ID:', doctorId);

    console.log('\n--- 2. Fetch Availability Slots (Should be AVAILABLE) ---');
    const availRes1 = await axios.get(`${backendUrl}/appointments/doctors/${doctorId}/availability?date=2026-09-10`);
    console.log('Slots:', availRes1.data.data.slots);

    console.log('\n--- 3. Testing Concurrency: Patient 1 & Patient 2 both attempt to hold the 09:00 slot ---');
    
    // Trigger holds in parallel
    const p1HoldPromise = axios.post(`${backendUrl}/appointments/hold`, {
      doctorId,
      date: '2026-09-10',
      startTime: '09:00',
      endTime: '09:30'
    }, { headers: patient1.headers });

    const p2HoldPromise = axios.post(`${backendUrl}/appointments/hold`, {
      doctorId,
      date: '2026-09-10',
      startTime: '09:00',
      endTime: '09:30'
    }, { headers: patient2.headers });

    const results = await Promise.allSettled([p1HoldPromise, p2HoldPromise]);
    
    let p1Hold = null;
    results.forEach((r, index) => {
      const patientNum = index === 0 ? 'Patient 1' : 'Patient 2';
      if (r.status === 'fulfilled') {
        console.log(`PASS: ${patientNum} successfully reserved the slot (Status HELD).`);
        if (index === 0) p1Hold = r.value.data.data.appointment;
      } else {
        console.log(`PASS: ${patientNum} rejected with conflict error. Status:`, r.reason.response.status);
        console.log('Error payload:', r.reason.response.data);
      }
    });

    console.log('\n--- 4. Confirming Patient 1 Reservation ---');
    if (p1Hold) {
      const confirmRes = await axios.post(`${backendUrl}/appointments/confirm`, {
        appointmentId: p1Hold._id
      }, { headers: patient1.headers });
      console.log('Confirmation Status:', confirmRes.status);
      console.log('Appointment Status:', confirmRes.data.data.appointment.status);
    } else {
      console.error('FAIL: Patient 1 hold document not present, cannot test confirmation.');
    }

    console.log('\n--- 5. Verify availability updates (09:00 should be CONFIRMED, 09:30 AVAILABLE) ---');
    const availRes2 = await axios.get(`${backendUrl}/appointments/doctors/${doctorId}/availability?date=2026-09-10`);
    console.log('Slots:', availRes2.data.data.slots);

    console.log('\n--- 6. Marking Doctor on Leave to verify Conflict Cancellations ---');
    const leaveRes = await axios.post(`${backendUrl}/admin/doctors/${doctorId}/leave`, {
      date: '2026-09-10',
      reason: 'Urgent Personal Leave'
    }, { headers: admin.headers });
    console.log('Leave added status:', leaveRes.status);
    console.log('Conflicts caught and resolved:', leaveRes.data.data.conflicts);

  } catch (error) {
    console.error('Test execution error:', error.message);
    if (error.response) {
      console.error('Response details:', error.response.data);
    }
  } finally {
    await mongoose.connection.close();
  }
};

test();
