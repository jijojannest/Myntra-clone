import express from 'express';
import { authenticate } from '../middleware/auth';

const router = express.Router();

// Placeholder routes - to be implemented
router.use(authenticate);

router.get('/', (req, res) => {
  res.json({
    success: true,
    data: {
      items: [],
      itemCount: 0,
      lastUpdated: new Date().toISOString(),
    },
  });
});

export default router;