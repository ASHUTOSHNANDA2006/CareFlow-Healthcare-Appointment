import axios from 'axios';
import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import Leave from '../src/models/Leave.js';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

const test = async () => {
  await connectDB();

  // Clear existing records
  await User.deleteMany({ email: { $in: ['admin_test@careflow.com', 'doctor_test@careflow.com'] } });
  await Leave.deleteMany({});

  const backendUrl = 'http://localhost:5000/api';
  const cookieJar = {
    cookies: '',
    setCookie(headers) {
      const setCookieHeader = headers['set-cookie'];
      if (setCookieHeader) {
        this.cookies = setCookieHeader.map(c => c.split(';')[0]).join('; ');
      }
    },
    getHeaders() {
      return this.cookies ? { Cookie: this.cookies } : {};
    }
  };

  try {
    console.log('\n--- 1. Registering Admin Account ---');
    const adminReg = await axios.post(`${backendUrl}/auth/register`, {
      name: 'Admin user',
      email: 'admin_test@careflow.com',
      password: 'adminpassword',
      role: 'admin'
    });
    console.log('Admin Reg Status:', adminReg.status);
    cookieJar.setCookie(adminReg.headers);

    console.log('\n--- 2. Creating Doctor Profile as Admin ---');
    const docCreate = await axios.post(`${backendUrl}/admin/doctors`, {
      name: 'Dr. John Doe',
      email: 'doctor_test@careflow.com',
      password: 'doctorpassword',
      specialization: 'Cardiology',
      qualification: 'MD, DM',
      experience: 12,
      slotDuration: 30,
      workingHours: { start: '09:00', end: '17:00' }
    }, {
      headers: cookieJar.getHeaders()
    });
    console.log('Doctor Creation Status:', docCreate.status);
    console.log('Doctor ID:', docCreate.data.data.doctor.id);
    const doctorId = docCreate.data.data.doctor.id;

    console.log('\n--- 3. Testing Doctor Search (Public Interface) ---');
    const searchRes = await axios.get(`${backendUrl}/doctors?specialization=Cardiology`);
    console.log('Search Status:', searchRes.status);
    console.log('Search Data Count:', searchRes.data.data.doctors.length);
    if (searchRes.data.data.doctors.length > 0) {
      console.log('PASS: Doctor successfully found via search.');
    } else {
      console.error('FAIL: No doctor found matching specialization.');
    }

    console.log('\n--- 4. Setting Doctor Leave as Admin ---');
    const leaveRes = await axios.post(`${backendUrl}/admin/doctors/${doctorId}/leave`, {
      date: '2026-09-01',
      reason: 'Medical Conference'
    }, {
      headers: cookieJar.getHeaders()
    });
    console.log('Leave Booking Status:', leaveRes.status);
    console.log('Leave Registered on Date:', leaveRes.data.data.leave.date);

    console.log('\n--- 5. Verify database matches ---');
    const dbLeave = await Leave.findOne({ doctorId });
    if (dbLeave && dbLeave.reason === 'Medical Conference') {
      console.log('PASS: Doctor leave is registered inside MongoDB.');
    } else {
      console.error('FAIL: Doctor leave not found in database.');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  } finally {
    await mongoose.connection.close();
  }
};

test();
