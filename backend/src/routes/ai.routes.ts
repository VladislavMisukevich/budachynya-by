import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ask, getHistory } from '../controllers/ai.controller';

const router = Router();

router.use(authMiddleware);
router.post('/ask', ask);
router.get('/history', getHistory);

export default router;
