import { Router } from 'express';
import { AssetController } from '../controllers/asset.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();
const assetController = new AssetController();

router.get('/', authenticate, (req, res) => assetController.getAll(req, res));
router.get('/:id', authenticate, (req, res) => assetController.getById(req, res));

// Admin only endpoints
router.post('/', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  assetController.create(req, res),
);
router.put('/:id', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  assetController.update(req, res),
);
router.delete('/:id', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  assetController.delete(req, res),
);

export default router;
