import { Request, Response } from 'express';
import { AssetService } from '../services/asset.service';
import { AssetStatus } from '@prisma/client';
import { z } from 'zod';

const assetService = new AssetService();

const createAssetSchema = z.object({
  tag: z.string().optional(),
  serialNumber: z.string().min(1, 'Serial number is required'),
  brand: z.string().min(1, 'Brand is required'),
  model: z.string().min(1, 'Model is required'),
  categoryId: z.string().uuid('Invalid Category ID'),
  purchaseDate: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: 'Invalid purchase date',
  }),
  vendorId: z.string().uuid('Invalid Vendor ID').optional().nullable(),
  cost: z.number().min(0, 'Cost must be a positive number'),
  warrantyExpiry: z
    .string()
    .refine((val) => !isNaN(Date.parse(val)), {
      message: 'Invalid warranty date',
    })
    .optional()
    .nullable(),
  status: z.nativeEnum(AssetStatus).optional(),
  imageUrl: z.string().optional().nullable(),
});

const updateAssetSchema = createAssetSchema.partial();

export class AssetController {
  async getAll(req: Request, res: Response) {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;
      const search = req.query.search as string | undefined;
      const categoryId = req.query.categoryId as string | undefined;
      const status = req.query.status as AssetStatus | undefined;
      const sortBy = req.query.sortBy as string | undefined;
      const sortOrder = req.query.sortOrder as 'asc' | 'desc' | undefined;

      const result = await assetService.getAllAssets({
        page,
        limit,
        search,
        categoryId,
        status,
        sortBy,
        sortOrder,
      });

      return res.status(200).json(result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(500).json({ error: message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const asset = await assetService.getAssetById(req.params.id);
      return res.status(200).json(asset);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(404).json({ error: message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const parsedData = createAssetSchema.parse(req.body);
      const asset = await assetService.createAsset(parsedData);
      return res.status(201).json(asset);
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
      const parsedData = updateAssetSchema.parse(req.body);
      const asset = await assetService.updateAsset(req.params.id, parsedData);
      return res.status(200).json(asset);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(400).json({ error: message });
    }
  }

  async delete(req: Request, res: Response) {
    try {
      await assetService.deleteAsset(req.params.id);
      return res.status(200).json({ message: 'Asset deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(400).json({ error: message });
    }
  }
}
