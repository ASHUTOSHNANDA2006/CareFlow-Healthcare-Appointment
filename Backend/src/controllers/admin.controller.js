import User from '../models/User.js';
import Doctor from '../models/Doctor.js';
import Patient from '../models/Patient.js';
import Appointment from '../models/Appointment.js';
import Leave from '../models/Leave.js';
import { handleLeaveConflicts } from '../services/appointment/leave.service.js';

export const getAdminUsers = async (req, res, next) => {
  try {
    const users = await User.find({}, '-passwordHash').sort({ createdAt: -1 });
    const patients = await Patient.find();
    const doctors = await Doctor.find().populate('userId', 'name email');
    res.status(200).json({ success: true, data: { users, patients, doctors } });
  } catch (error) {
    next(error);
  }
};

export const toggleUserStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'You cannot deactivate your own admin account.' } });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.status(200).json({ success: true, data: { user: { id: user._id, name: user.name, email: user.email, role: user.role, isActive: user.isActive } } });
  } catch (error) {
    next(error);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) {
      return res.status(400).json({ success: false, error: { code: 'INVALID_ACTION', message: 'You cannot delete your own admin account.' } });
    }
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, error: { code: 'USER_NOT_FOUND', message: 'User not found.' } });
    }
    // Safe deactivation model to preserve medical record foreign keys
    user.isActive = false;
    await user.save();
    res.status(200).json({ success: true, message: 'User account deactivated successfully.' });
  } catch (error) {
    next(error);
  }
};

export const getAdminAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find()
      .populate({ path: 'doctorId', select: 'specialization', populate: { path: 'userId', select: 'name' } })
      .populate('patientId', 'name email')
      .sort({ date: -1 })
      .limit(100);
    res.status(200).json({ success: true, data: { appointments } });
  } catch (error) {
    next(error);
  }
};

export const getAdminDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().populate('userId', 'name email');
    res.status(200).json({ success: true, data: { doctors } });
  } catch (error) {
    next(error);
  }
};

export const createDoctor = async (req, res, next) => {
  try {
    const { name, email, password, specialization, qualification, experience, slotDuration, workingHours } = req.body;

    if (!name || !email || !password || !specialization || !qualification || experience === undefined) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'All fields are required to create a doctor profile.',
        },
      });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'A user with this email already exists.',
        },
      });
    }

    // Create the User profile as a Doctor
    const passwordHash = await User.hashPassword(password);
    const user = await User.create({
      name,
      email,
      passwordHash,
      role: 'doctor',
    });

    // Create the Doctor associated document
    const doctor = await Doctor.create({
      userId: user._id,
      specialization,
      qualification,
      experience,
      slotDuration: slotDuration || 30,
      workingHours: workingHours || { start: '09:00', end: '17:00' },
    });

    res.status(201).json({
      success: true,
      data: {
        doctor: {
          id: doctor._id,
          name: user.name,
          email: user.email,
          specialization: doctor.specialization,
          qualification: doctor.qualification,
          experience: doctor.experience,
          slotDuration: doctor.slotDuration,
          workingHours: doctor.workingHours,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDoctor = async (req, res, next) => {
  try {
    const { specialization, qualification, experience, slotDuration, workingHours } = req.body;
    const { id } = req.params;

    const doctor = await Doctor.findById(id);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCTOR_NOT_FOUND',
          message: 'Doctor profile not found.',
        },
      });
    }

    if (specialization) doctor.specialization = specialization;
    if (qualification) doctor.qualification = qualification;
    if (experience !== undefined) doctor.experience = experience;
    if (slotDuration) doctor.slotDuration = slotDuration;
    if (workingHours) doctor.workingHours = workingHours;

    await doctor.save();

    res.status(200).json({
      success: true,
      data: {
        doctor,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const addDoctorLeave = async (req, res, next) => {
  try {
    const { doctorId } = req.params;
    const { date, reason } = req.body;

    if (!date) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Leave date is required.',
        },
      });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCTOR_NOT_FOUND',
          message: 'Doctor profile not found.',
        },
      });
    }

    // Normalize date to remove time component (YYYY-MM-DD)
    const leaveDate = new Date(date);
    leaveDate.setUTCHours(0, 0, 0, 0);

    const existingLeave = await Leave.findOne({ doctorId, date: leaveDate });
    if (existingLeave) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'DUPLICATE_LEAVE',
          message: 'This doctor is already marked on leave for this date.',
        },
      });
    }

    const leave = await Leave.create({
      doctorId,
      date: leaveDate,
      reason: reason || '',
    });

    // Check for affected appointments and cancel them (resolving conflicts)
    const conflictResult = await handleLeaveConflicts(doctorId, date, reason);

    res.status(201).json({
      success: true,
      data: {
        leave,
        conflicts: conflictResult,
      },
    });
  } catch (error) {
    next(error);
  }
};
