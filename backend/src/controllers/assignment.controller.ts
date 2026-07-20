import { Request, Response } from 'express';
import { AssignmentService } from '../services/assignment.service';
import { AssignmentStatus } from '@prisma/client';
import { z } from 'zod';

const assignmentService = new AssignmentService();

const checkoutSchema = z.object({
  assetId: z.string().uuid('Invalid Asset ID'),
  userId: z.string().uuid('Invalid User ID'),
  assignedAt: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid checkout date',
    })
    .optional(),
  returnNotes: z.string().optional(),
});

const returnSchema = z.object({
  notes: z.string().optional(),
});

export class AssignmentController {
  async getAll(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const search = req.query.search as string | undefined;
      const status = req.query.status as AssignmentStatus | undefined;
      const userId = req.query.userId as string | undefined;
      const assetId = req.query.assetId as string | undefined;

      const result = await assignmentService.getAllAssignments({
        page,
        limit,
        search,
        status,
        userId,
        assetId,
      });

      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(500).json({ error: message });
    }
  }

  async checkout(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }

      const parsedData = checkoutSchema.parse(req.body);
      const assignment = await assignmentService.checkoutAsset({
        ...parsedData,
        assignedById: req.user.userId,
      });

      return res.status(201).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(400).json({ error: message });
    }
  }

  async return(req: Request, res: Response) {
    try {
      const parsedData = returnSchema.parse(req.body);
      const assignment = await assignmentService.returnAsset(req.params.id, parsedData);
      return res.status(200).json(assignment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(400).json({ error: message });
    }
  }
}
