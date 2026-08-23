import Doctor from '../models/Doctor.js';

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
