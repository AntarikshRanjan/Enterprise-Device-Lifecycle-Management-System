import prisma from '../lib/prisma';
import { Prisma } from '@prisma/client';

export interface GetAuditLogsFilter {
  userId?: string;
  action?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class AuditService {
  async getAllLogs(filter: GetAuditLogsFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 20;
    const skip = (page - 1) * limit;

    const where: Prisma.AuditLogWhereInput = {};

    if (filter.userId) {
      where.userId = filter.userId;
    }
    if (filter.action) {
      where.action = filter.action;
    }

    if (filter.search) {
      where.OR = [
        { action: { contains: filter.search, mode: 'insensitive' } },
        { targetTable: { contains: filter.search, mode: 'insensitive' } },
        { targetId: { contains: filter.search, mode: 'insensitive' } },
        { ipAddress: { contains: filter.search, mode: 'insensitive' } },
        {
          user: {
            OR: [
              { email: { contains: filter.search, mode: 'insensitive' } },
              { firstName: { contains: filter.search, mode: 'insensitive' } },
              { lastName: { contains: filter.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [total, logs] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        skip,
        take: limit,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: { select: { name: true } },
            },
          },
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      logs,
    };
  }

  async getLogById(id: string) {
    const log = await prisma.auditLog.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            role: { select: { name: true } },
          },
        },
      },
    });

    if (!log) {
      throw new Error(`Audit log with ID ${id} not found`);
    }

    return log;
  }
}
