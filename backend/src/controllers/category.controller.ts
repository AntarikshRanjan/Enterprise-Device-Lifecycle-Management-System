import { Request, Response } from 'express';
import { CategoryService } from '../services/category.service';
import { z } from 'zod';

const categoryService = new CategoryService();

const createCategorySchema = z.object({
  name: z.string().min(1, 'Category name is required'),
  description: z.string().optional(),
});

const updateCategorySchema = z.object({
  name: z.string().min(1, 'Category name cannot be empty').optional(),
  description: z.string().optional(),
});

export class CategoryController {
  async getAll(_req: Request, res: Response) {
    try {
      const categories = await categoryService.getAllCategories();
      return res.status(200).json(categories);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(500).json({ error: message });
    }
  }

  async getById(req: Request, res: Response) {
    try {
      const category = await categoryService.getCategoryById(req.params.id);
      return res.status(200).json(category);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(404).json({ error: message });
    }
  }

  async create(req: Request, res: Response) {
    try {
      const parsedData = createCategorySchema.parse(req.body);
      const category = await categoryService.createCategory(parsedData);
      return res.status(201).json(category);
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
      const parsedData = updateCategorySchema.parse(req.body);
      const category = await categoryService.updateCategory(req.params.id, parsedData);
      return res.status(200).json(category);
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
      await categoryService.deleteCategory(req.params.id);
      return res.status(200).json({ message: 'Category deleted successfully' });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(400).json({ error: message });
    }
  }
}
