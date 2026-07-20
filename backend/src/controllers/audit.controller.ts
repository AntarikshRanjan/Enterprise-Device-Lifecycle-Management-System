import { Request, Response } from 'express';
import { AuditService } from '../services/audit.service';

const auditService = new AuditService();

export class AuditController {
  async getAll(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const search = req.query.search as string | undefined;
      const action = req.query.action as string | undefined;
      const userId = req.query.userId as string | undefined;

      const result = await auditService.getAllLogs({
        page,
        limit,
        search,
        action,
        userId,
      });

      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(500).json({ error: message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const log = await auditService.getLogById(req.params.id);
      return res.status(200).json(log);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(404).json({ error: message });
    }
  }
}
