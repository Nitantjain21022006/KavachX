import express from 'express';
import { executeAction, executeBulkAction } from '../controllers/responses.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/execute', protect, executeAction);
router.post('/execute-bulk', protect, executeBulkAction);

export default router;
