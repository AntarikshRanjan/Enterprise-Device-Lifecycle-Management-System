import prisma from '../lib/prisma';
import { AssignmentStatus, Prisma } from '@prisma/client';

export interface GetEmployeesFilter {
  departmentId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class EmployeeService {
  async getAllEmployees(filter: GetEmployeesFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 15;
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {};

    if (filter.departmentId) {
      where.departmentId = filter.departmentId;
    }

    if (filter.search) {
      where.OR = [
        { email: { contains: filter.search, mode: 'insensitive' } },
        { firstName: { contains: filter.search, mode: 'insensitive' } },
        { lastName: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        orderBy: { firstName: 'asc' },
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          createdAt: true,
          role: {
            select: { name: true },
          },
          department: {
            select: { id: true, name: true },
          },
          _count: {
            select: {
              assignments: {
                where: { status: AssignmentStatus.ACTIVE },
              },
            },
          },
        },
      }),
    ]);

    const employees = users.map((user) => ({
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      createdAt: user.createdAt,
      role: user.role.name,
      department: user.department?.name || 'Unassigned',
      activeCheckoutCount: user._count.assignments,
    }));

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      employees,
    };
  }

  async getEmployeeDetails(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        role: {
          select: { name: true },
        },
        department: {
          select: { id: true, name: true },
        },
      },
    });

    if (!user) {
      throw new Error(`Employee with ID ${id} not found`);
    }

    const currentCheckouts = await prisma.assignment.findMany({
      where: {
        userId: id,
        status: AssignmentStatus.ACTIVE,
      },
      include: {
        asset: {
          include: { category: true },
        },
      },
      orderBy: { assignedAt: 'desc' },
    });

    const pastCheckouts = await prisma.assignment.findMany({
      where: {
        userId: id,
        status: AssignmentStatus.RETURNED,
      },
      include: {
        asset: {
          include: { category: true },
        },
      },
      orderBy: { returnedAt: 'desc' },
    });

    return {
      employee: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        createdAt: user.createdAt,
        role: user.role.name,
        department: user.department?.name || 'Unassigned',
      },
      currentCheckouts,
      pastCheckouts,
    };
  }

  async getAllDepartments() {
    return prisma.department.findMany({
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        description: true,
        _count: {
          select: { users: true },
        },
      },
    });
  }
}
