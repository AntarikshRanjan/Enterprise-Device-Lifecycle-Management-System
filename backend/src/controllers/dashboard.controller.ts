import { Request, Response } from 'express';
import { DashboardService } from '../services/dashboard.service';

const dashboardService = new DashboardService();

export class DashboardController {
  async getSummary(req: Request, res: Response) {
    try {
      const summary = await dashboardService.getDashboardSummary();
      return res.status(200).json(summary);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(500).json({ error: message });
    }
  }
}
