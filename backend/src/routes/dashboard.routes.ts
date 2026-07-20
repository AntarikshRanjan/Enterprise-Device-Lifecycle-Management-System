import { Router } from 'express';
import { DashboardController } from '../controllers/dashboard.controller';
import { authenticate } from '../middlewares/auth.middleware';

const router = Router();
const dashboardController = new DashboardController();

router.get('/summary', authenticate, (req, res) => dashboardController.getSummary(req, res));

export default router;
