import express from 'express';
import { createDoctor, updateDoctor, addDoctorLeave, getAdminUsers, getAdminAppointments, getAdminDoctors } from '../controllers/admin.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

// All administrative routes require auth and admin role
router.use(requireAuth, requireRole('admin'));

router.get('/users', getAdminUsers);
router.get('/appointments', getAdminAppointments);
router.get('/doctors', getAdminDoctors);
router.post('/doctors', createDoctor);
router.patch('/doctors/:id', updateDoctor);
router.post('/doctors/:doctorId/leave', addDoctorLeave);

export default router;
