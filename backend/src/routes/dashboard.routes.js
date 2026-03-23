import express from 'express';
import { getDashboardData, emailDossier } from '../controllers/dashboard.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authMiddleware, getDashboardData);
router.post('/send-dossier', authMiddleware, emailDossier);

export default router;
