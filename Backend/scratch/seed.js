import User from '../src/models/User.js';
import Doctor from '../src/models/Doctor.js';
import Patient from '../src/models/Patient.js';
import { connectDB } from '../src/config/db.js';
import mongoose from 'mongoose';

const seed = async () => {
  await connectDB();

  try {
    console.log('Cleaning collections...');
    await User.deleteMany({});
    await Patient.deleteMany({});
    await Doctor.deleteMany({});

    console.log('Seeding users...');
    const hash = await User.hashPassword('password123');

    // 1. Admin
    const admin = await User.create({
      name: 'CareFlow Administrator',
      email: 'admin@careflow.com',
      passwordHash: hash,
      role: 'admin',
    });

    // 2. Doctor
    const doctorUser = await User.create({
      name: 'Dr. Priya Sharma',
      email: 'doctor@careflow.com',
      passwordHash: hash,
      role: 'doctor',
    });

    const doctor = await Doctor.create({
      userId: doctorUser._id,
      specialization: 'General Medicine',
      qualification: 'MBBS, MD',
      experience: 10,
      slotDuration: 30,
      workingHours: { start: '09:00', end: '17:00' },
    });

    // 3. Patient A
    const patientAUser = await User.create({
      name: 'Rahul Sharma',
      email: 'patient@careflow.com',
      passwordHash: hash,
      role: 'patient',
    });

    await Patient.create({
      userId: patientAUser._id,
      medicalHistory: ['Hypertension'],
      allergies: ['Penicillin'],
    });

    // 4. Patient B
    const patientBUser = await User.create({
      name: 'Amit Kumar',
      email: 'patientb@careflow.com',
      passwordHash: hash,
      role: 'patient',
    });

    await Patient.create({
      userId: patientBUser._id,
      medicalHistory: [],
      allergies: [],
    });

    console.log('Seeding complete! Admin, Doctor, and 2 Patients successfully registered.');

  } catch (err) {
    console.error('Seeding failed:', err.message);
  } finally {
    await mongoose.connection.close();
  }
};

seed();
