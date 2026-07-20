import prisma from '../lib/prisma';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';

export interface RegisterInput {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  roleName: string; // e.g. "SUPER_ADMIN", "IT_ADMIN", "MANAGER", "EMPLOYEE"
  departmentId?: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export class AuthService {
  async register(input: RegisterInput) {
    // 1. Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
    });

    if (existingUser) {
      throw new Error('Email is already registered');
    }

    // 2. Fetch the role by name
    const role = await prisma.role.findUnique({
      where: { name: input.roleName },
    });

    if (!role) {
      throw new Error(`Role '${input.roleName}' does not exist`);
    }

    // 3. Hash the password
    const passwordHash = await hashPassword(input.password);

    // 4. Create the user
    const newUser = await prisma.user.create({
      data: {
        email: input.email.toLowerCase(),
        passwordHash,
        firstName: input.firstName,
        lastName: input.lastName,
        roleId: role.id,
        departmentId: input.departmentId,
      },
      include: {
        role: true,
        department: true,
      },
    });

    // Remove password hash from response
    const userWithoutPassword = { ...newUser } as Partial<typeof newUser>;
    delete userWithoutPassword.passwordHash;
    return userWithoutPassword;
  }

  async login(input: LoginInput) {
    // 1. Find user by email
    const user = await prisma.user.findUnique({
      where: { email: input.email.toLowerCase() },
      include: {
        role: true,
      },
    });

    if (!user) {
      throw new Error('Invalid email or password');
    }

    // 2. Compare passwords
    const isValidPassword = await comparePassword(input.password, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('Invalid email or password');
    }

    // 3. Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role.name,
    });

    const userWithoutPassword = { ...user } as Partial<typeof user>;
    delete userWithoutPassword.passwordHash;
    return {
      token,
      user: userWithoutPassword,
    };
  }

  async getCurrentUser(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        role: true,
        department: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const userWithoutPassword = { ...user } as Partial<typeof user>;
    delete userWithoutPassword.passwordHash;
    return userWithoutPassword;
  }
}
