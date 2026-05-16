import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  addGrade,
  getGrades,
  editGrade,
  removeGrade,
  getSubjects,
} from '../controllers/grades.controller';

const router = Router();

router.use(authMiddleware);

router.get('/subjects', getSubjects);
router.get('/', getGrades);
router.post('/', addGrade);
router.put('/:id', editGrade);
router.delete('/:id', removeGrade);

export default router;
