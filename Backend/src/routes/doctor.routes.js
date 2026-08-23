import express from 'express';
import {
  getAllDoctors,
  getDoctorById,
  getDoctorMe,
  getDoctorMeLeaves,
  addDoctorMeLeave,
  deleteDoctorMeLeave,
} from '../controllers/doctor.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// Public doctor directory
router.get('/', getAllDoctors);

// Doctor self-management routes (require doctor role)
router.get('/me', requireAuth, requireRole('doctor'), getDoctorMe);
router.get('/me/leaves', requireAuth, requireRole('doctor'), getDoctorMeLeaves);
router.post('/me/leave', requireAuth, requireRole('doctor'), addDoctorMeLeave);
router.delete('/me/leave/:id', requireAuth, requireRole('doctor'), deleteDoctorMeLeave);

router.get('/:id', getDoctorById);

export default router;
