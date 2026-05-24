import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { generate, getPlan, toggle } from '../controllers/tracker.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', getPlan);
router.post('/generate', generate);
router.patch('/steps/:index/toggle', toggle);

export default router;
