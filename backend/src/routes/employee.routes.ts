import { Router } from 'express';
import { EmployeeController } from '../controllers/employee.controller';
import { authenticate } from '../middlewares/auth.middleware';
import { authorize } from '../middlewares/role.middleware';

const router = Router();
const employeeController = new EmployeeController();

router.get('/', authenticate, (req, res) => employeeController.getAll(req, res));
router.get('/departments', authenticate, (req, res) => employeeController.getDepartments(req, res));

// Detailed view is restricted to admins
router.get('/:id', authenticate, authorize(['SUPER_ADMIN', 'IT_ADMIN']), (req, res) =>
  employeeController.getDetails(req, res),
);

export default router;
