import { Router } from 'express';
import { AuditController } from '../controllers/audit.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();
const auditController = new AuditController();

router.get('/', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  auditController.getAll(req, res),
);
router.get('/:id', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  auditController.getById(req, res),
);

export default router;
