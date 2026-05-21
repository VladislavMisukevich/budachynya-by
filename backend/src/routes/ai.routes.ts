import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { ask, getHistory, getLoadCRI, calcInitialCRI, recalcCRI } from '../controllers/ai.controller';

const router = Router();
router.use(authMiddleware);
router.post('/ask', ask);
router.get('/history', getHistory);
router.get('/cri', getLoadCRI);
router.post('/cri/initial', calcInitialCRI);
router.post('/cri/recalc', recalcCRI);

export default router;
