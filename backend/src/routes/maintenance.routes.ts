import { Router } from 'express';
import { MaintenanceController } from '../controllers/maintenance.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();
const maintenanceController = new MaintenanceController();

router.get('/', authenticate, (req, res) => maintenanceController.getAll(req, res));
router.get('/:id', authenticate, (req, res) => maintenanceController.getById(req, res));
router.post('/', authenticate, (req, res) => maintenanceController.create(req, res));

// Admin only endpoints
router.put('/:id', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  maintenanceController.update(req, res),
);
router.post('/:id/resolve', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  maintenanceController.resolve(req, res),
);

export default router;
