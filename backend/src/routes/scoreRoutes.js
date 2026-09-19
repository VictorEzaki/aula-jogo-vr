import { Router } from 'express';
import scoreController from '../controllers/scoreController.js';

const router = Router();

router.get('/top', scoreController.getTopScores);
router.post('/', scoreController.createScore);
router.put('/:id', scoreController.updateScore);

export default router;
