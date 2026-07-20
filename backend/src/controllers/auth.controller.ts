import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { z } from 'zod';

const authService = new AuthService();

// Input Validation Schemas
const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  roleName: z.enum(['SUPER_ADMIN', 'IT_ADMIN', 'MANAGER', 'EMPLOYEE']),
  departmentId: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export class AuthController {
  async register(req: Request, res: Response) {
    try {
      const parsedData = registerSchema.parse(req.body);
      const user = await authService.register(parsedData);
      return res.status(201).json(user);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(400).json({ error: message });
    }
  }

  async login(req: Request, res: Response) {
    try {
      const parsedData = loginSchema.parse(req.body);
      const result = await authService.login(parsedData);
      return res.status(200).json(result);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Validation failed', details: error.issues });
      }
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(401).json({ error: message });
    }
  }

  async me(req: Request, res: Response) {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'User not authenticated' });
      }
      const user = await authService.getCurrentUser(req.user.userId);
      return res.status(200).json(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(404).json({ error: message });
    }
  }

  async listUsers(_req: Request, res: Response) {
    try {
      const users = await authService.listAllUsers();
      return res.status(200).json(users);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'An unknown error occurred';
      return res.status(500).json({ error: message });
    }
  }
}
