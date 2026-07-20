import { Router } from 'express';
import { AssignmentController } from '../controllers/assignment.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();
const assignmentController = new AssignmentController();

router.get('/', authenticate, (req, res) => assignmentController.getAll(req, res));

// Admin only endpoints
router.post('/checkout', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  assignmentController.checkout(req, res),
);
router.post('/:id/return', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  assignmentController.return(req, res),
);

export default router;
