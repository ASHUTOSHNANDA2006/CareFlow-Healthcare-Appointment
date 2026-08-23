import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import Leave from '../src/models/Leave.js';
import Appointment from '../src/models/Appointment.js';
import Notification from '../src/models/Notification.js';
import BlacklistedToken from '../src/models/BlacklistedToken.js';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

const seed = async () => {
  await connectDB();

  try {
    console.log('Cleaning collections...');
    await User.deleteMany({});
    await Doctor.deleteMany({});
    await Leave.deleteMany({});
    await Appointment.deleteMany({});
    await Notification.deleteMany({});
    await BlacklistedToken.deleteMany({});

    console.log('Seeding users...');
    const patientHash = await User.hashPassword('password123');
    const doctorHash = await User.hashPassword('password123');
    const adminHash = await User.hashPassword('password123');

    // 1. Patient
    const patient = await User.create({
      name: 'Rahul Sharma',
      email: 'patient@careflow.com',
      passwordHash: patientHash,
      role: 'patient',
    });

    // 2. Doctor
    const doctorUser = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'doctor@careflow.com',
      passwordHash: doctorHash,
      role: 'doctor',
    });

    // Associated Doctor Profile
    const doctor = await Doctor.create({
      userId: doctorUser._id,
      specialization: 'General Medicine',
      qualification: 'MBBS, MD',
      experience: 10,
      slotDuration: 30,
      workingHours: { start: '09:00', end: '17:00' },
    });

    // 3. Admin
    const admin = await User.create({
      name: 'CareFlow Administrator',
      email: 'admin@careflow.com',
      passwordHash: adminHash,
      role: 'admin',
    });

    console.log('\n=============================================');
    console.log('Database seeded successfully!');
    console.log('=============================================');
    console.log('Demo Credentials:');
    console.log('---------------------------------------------');
    console.log('PATIENT:');
    console.log('  Email:   patient@careflow.com');
    console.log('  Pass:    password123');
    console.log('---------------------------------------------');
    console.log('DOCTOR:');
    console.log('  Email:   doctor@careflow.com');
    console.log('  Pass:    password123');
    console.log('---------------------------------------------');
    console.log('ADMIN:');
    console.log('  Email:   admin@careflow.com');
    console.log('  Pass:    password123');
    console.log('=============================================\n');

  } catch (error) {
    console.error('Seeding database failed:', error.message);
  } finally {
    await mongoose.connection.close();
  }
};

seed();
