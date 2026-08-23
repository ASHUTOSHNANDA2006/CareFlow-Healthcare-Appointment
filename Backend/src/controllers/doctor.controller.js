import Doctor from '../models/Doctor.js';
import Leave from '../models/Leave.js';
import { handleLeaveConflicts } from '../services/appointment/leave.service.js';

export const getAllDoctors = async (req, res, next) => {
  try {
    const { search, specialization } = req.query;
    let query = {};

    if (specialization) {
      query.specialization = { $regex: specialization, $options: 'i' };
    }

    let doctors = await Doctor.find(query).populate('userId', 'name email');

    if (search) {
      const searchRegex = new RegExp(search, 'i');
      doctors = doctors.filter((doc) => {
        return (
          doc.specialization.match(searchRegex) ||
          (doc.userId && doc.userId.name.match(searchRegex))
        );
      });
    }

    res.status(200).json({
      success: true,
      data: {
        doctors,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDoctorById = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).populate('userId', 'name email');
    if (!doctor) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'DOCTOR_NOT_FOUND',
          message: 'Doctor profile not found.',
        },
      });
    }

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

export const getDoctorMe = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id }).populate('userId', 'name email');
    if (!doctor) {
      return res.status(404).json({ success: false, error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' } });
    }
    res.status(200).json({ success: true, data: { doctor } });
  } catch (error) {
    next(error);
  }
};

export const getDoctorMeLeaves = async (req, res, next) => {
  try {
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' } });
    }
    const leaves = await Leave.find({ doctorId: doctor._id }).sort({ date: 1 });
    res.status(200).json({ success: true, data: { leaves } });
  } catch (error) {
    next(error);
  }
};

export const addDoctorMeLeave = async (req, res, next) => {
  try {
    const { date, reason } = req.body;
    if (!date) {
      return res.status(400).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'Date is required.' } });
    }
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' } });
    }

    const leaveDate = new Date(date);
    leaveDate.setUTCHours(0, 0, 0, 0);

    const existing = await Leave.findOne({ doctorId: doctor._id, date: leaveDate });
    if (existing) {
      return res.status(400).json({ success: false, error: { code: 'DUPLICATE_LEAVE', message: 'Leave already marked for this date.' } });
    }

    const leave = await Leave.create({ doctorId: doctor._id, date: leaveDate, reason: reason || '' });
    const conflicts = await handleLeaveConflicts(doctor._id, date, reason);

    res.status(201).json({ success: true, data: { leave, conflicts } });
  } catch (error) {
    next(error);
  }
};

export const deleteDoctorMeLeave = async (req, res, next) => {
  try {
    const { id } = req.params;
    const doctor = await Doctor.findOne({ userId: req.user._id });
    if (!doctor) {
      return res.status(404).json({ success: false, error: { code: 'DOCTOR_NOT_FOUND', message: 'Doctor profile not found.' } });
    }
    const leave = await Leave.findOneAndDelete({ _id: id, doctorId: doctor._id });
    if (!leave) {
      return res.status(404).json({ success: false, error: { code: 'LEAVE_NOT_FOUND', message: 'Leave record not found or not owned by you.' } });
    }
    res.status(200).json({ success: true, message: 'Leave deleted successfully.' });
  } catch (error) {
    next(error);
  }
};
