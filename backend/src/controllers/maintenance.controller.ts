import { Request, Response } from 'express';
import { MaintenanceService } from '../services/maintenance.service';
import { TicketPriority, TicketStatus, AssetStatus } from '@prisma/client';
import { z } from 'zod';

const maintenanceService = new MaintenanceService();

const createTicketSchema = z.object({
  assetId: z.string().uuid('Invalid Asset ID'),
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  priority: z.nativeEnum(TicketPriority).optional(),
});

const updateTicketSchema = z.object({
  technicianId: z.string().uuid('Invalid Technician ID').optional().nullable(),
  priority: z.nativeEnum(TicketPriority).optional(),
  status: z.nativeEnum(TicketStatus).optional(),
  description: z.string().optional(),
});

const resolveTicketSchema = z.object({
  cost: z.number().min(0, 'Cost must be a positive number'),
  assetStatus: z.nativeEnum(AssetStatus).default(AssetStatus.AVAILABLE),
  notes: z.string().optional(),
});

export class MaintenanceController {
  async getAll(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const search = req.query.search as string | undefined;
      const status = req.query.status as TicketStatus | undefined;
      const priority = req.query.priority as TicketPriority | undefined;
      const assetId = req.query.assetId as string | undefined;

      const result = await maintenanceService.getAllTickets({
        page,
        limit,
        search,
        status,
        priority,
        assetId,
      });

      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(500).json({ error: message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const ticket = await maintenanceService.getTicketById(req.params.id);
      return res.status(200).json(ticket);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(404).json({ error: message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const parsedData = createTicketSchema.parse(req.body);
      const ticket = await maintenanceService.createTicket({
        ...parsedData,
        reporterId: req.user.userId,
      });

      return res.status(201).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(400).json({ error: message });
    }
  }

  async update(req: Request, res: Response) {
    try {
      const parsedData = updateTicketSchema.parse(req.body);
      const ticket = await maintenanceService.updateTicket(req.params.id, parsedData);
      return res.status(200).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(400).json({ error: message });
    }
  }

  async resolve(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const parsedData = resolveTicketSchema.parse(req.body);
      const ticket = await maintenanceService.resolveTicket(
        req.params.id,
        parsedData,
        req.user.userId,
      );
      return res.status(200).json(ticket);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(400).json({ error: message });
    }
  }
}
