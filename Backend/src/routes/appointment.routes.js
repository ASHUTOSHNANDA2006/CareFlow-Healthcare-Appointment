import express from 'express';
import {
  getAvailability,
  holdAppointmentSlot,
  confirmAppointment,
  getAppointments,
  getAppointmentById,
  cancelAppointment,
  rescheduleAppointment,
  getNotifications,
  markNotificationRead,
} from '../controllers/appointment.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';

const router = express.Router();

// Public availability check
router.get('/doctors/:doctorId/availability', getAvailability);

// Authenticated booking routes
router.use(requireAuth);
router.post('/hold', holdAppointmentSlot);
router.post('/confirm', confirmAppointment);
router.get('/', getAppointments);
router.get('/notifications', getNotifications);
router.patch('/notifications/:id/read', markNotificationRead);
router.get('/:id', getAppointmentById);
router.patch('/:id/cancel', cancelAppointment);
router.patch('/:id/reschedule', rescheduleAppointment);

export default router;
