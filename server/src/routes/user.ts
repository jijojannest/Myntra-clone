import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - to be implemented
router.use(authenticate);

export default router;