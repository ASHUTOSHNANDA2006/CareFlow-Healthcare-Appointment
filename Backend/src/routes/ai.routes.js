import express from 'express';
import { submitSymptoms, submitVisitNotes } from '../controllers/ai.controller.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { requireRole } from '../middlewares/role.middleware.js';

const router = express.Router();

router.use(requireAuth);

router.post('/pre-visit', requireRole('patient'), submitSymptoms);
router.post('/post-visit', requireRole('doctor'), submitVisitNotes);

export default router;
