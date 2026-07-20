import { Router } from 'express';
import { CategoryController } from '../controllers/category.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();
const categoryController = new CategoryController();

router.get('/', authenticate, (req, res) => categoryController.getAll(req, res));
router.get('/:id', authenticate, (req, res) => categoryController.getById(req, res));

// Admin only endpoints
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  categoryController.create(req, res),
);
router.put('/:id', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  categoryController.update(req, res),
);
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  categoryController.delete(req, res),
);

export default router;
