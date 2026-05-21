import { Router } from 'express';
import { authMiddleware } from '../middlewares/auth.middleware';
import {
  upsertGradeHandler, getGrades, removeGrade, getSubjectsHandler,
  createExamScore, getExamScores, deleteExamScore,
} from '../controllers/grades.controller';

const router = Router();
router.use(authMiddleware);

router.get('/subjects', getSubjectsHandler);
router.get('/', getGrades);
router.post('/', upsertGradeHandler);
router.delete('/:id', removeGrade);

router.get('/exams', getExamScores);
router.post('/exams', createExamScore);
router.delete('/exams/:id', deleteExamScore);

export default router;
