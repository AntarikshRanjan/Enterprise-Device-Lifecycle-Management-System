import { Request, Response } from 'express';
import { EmployeeService } from '../services/employee.service';

const employeeService = new EmployeeService();

export class EmployeeController {
  async getAll(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const search = req.query.search as string | undefined;
      const departmentId = req.query.departmentId as string | undefined;

      const result = await employeeService.getAllEmployees({
        page,
        limit,
        search,
        departmentId,
      });

      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(500).json({ error: message });
    }
  }

  async getDetails(req: Request, res: Response) {
    try {
      const details = await employeeService.getEmployeeDetails(req.params.id);
      return res.status(200).json(details);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(404).json({ error: message });
    }
  }

  async getDepartments(req: Request, res: Response) {
    try {
      const departments = await employeeService.getAllDepartments();
      return res.status(200).json(departments);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(500).json({ error: message });
    }
  }
}
