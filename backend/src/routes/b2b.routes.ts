import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import { listContracts, apply, myApplications } from '../controllers/b2b.controller';

const router = Router();
router.use(authMiddleware);
router.get('/', listContracts);
router.post('/:id/apply', apply);
router.get('/my', myApplications);

export default router;
