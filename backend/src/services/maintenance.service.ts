import prisma from '../lib/prisma';
import { AssetStatus, TicketPriority, TicketStatus, Prisma } from '@prisma/client';

export interface CreateTicketInput {
  assetId: string;
  reporterId: string;
  title: string;
  description: string;
  priority?: TicketPriority;
}

export interface UpdateTicketInput {
  technicianId?: string | null;
  priority?: TicketPriority;
  status?: TicketStatus;
  description?: string;
}

export interface ResolveTicketInput {
  cost: number;
  assetStatus: AssetStatus;
  notes?: string;
}

export interface GetTicketsFilter {
  status?: TicketStatus;
  priority?: TicketPriority;
  assetId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class MaintenanceService {
  async getAllTickets(filter: GetTicketsFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.MaintenanceTicketWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.priority) {
      where.priority = filter.priority;
    }
    if (filter.assetId) {
      where.assetId = filter.assetId;
    }

    if (filter.search) {
      where.OR = [
        { title: { contains: filter.search, mode: 'insensitive' } },
        { description: { contains: filter.search, mode: 'insensitive' } },
        {
          asset: {
            OR: [
              { tag: { contains: filter.search, mode: 'insensitive' } },
              { brand: { contains: filter.search, mode: 'insensitive' } },
              { model: { contains: filter.search, mode: 'insensitive' } },
            ],
          },
        },
      ];
    }

    const [total, tickets] = await Promise.all([
      prisma.maintenanceTicket.count({ where }),
      prisma.maintenanceTicket.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          asset: {
            include: {
              category: true,
            },
          },
          reporter: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          technician: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
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
      tickets,
    };
  }

  async getTicketById(id: string) {
    const ticket = await prisma.maintenanceTicket.findUnique({
      where: { id },
      include: {
        asset: {
          include: {
            category: true,
          },
        },
        reporter: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
        technician: {
          select: { id: true, email: true, firstName: true, lastName: true },
        },
      },
    });

    if (!ticket) {
      throw new Error(`Maintenance ticket with ID ${id} not found`);
    }

    return ticket;
  }

  async createTicket(input: CreateTicketInput) {
    const asset = await prisma.asset.findUnique({
      where: { id: input.assetId },
    });
    if (!asset) {
      throw new Error(`Asset with ID ${input.assetId} not found`);
    }

    return prisma.$transaction(async (tx) => {
      // 1. Create repair ticket row
      const ticket = await tx.maintenanceTicket.create({
        data: {
          assetId: input.assetId,
          reporterId: input.reporterId,
          title: input.title,
          description: input.description,
          priority: input.priority || TicketPriority.MEDIUM,
          status: TicketStatus.OPEN,
        },
        include: {
          asset: true,
        },
      });

      // 2. Set Asset status to MAINTENANCE
      await tx.asset.update({
        where: { id: input.assetId },
        data: { status: AssetStatus.MAINTENANCE },
      });

      // 3. Log Audit details
      await tx.auditLog.create({
        data: {
          userId: input.reporterId,
          action: 'MAINTENANCE_CREATE',
          targetTable: 'MaintenanceTicket',
          targetId: ticket.id,
          newValue: {
            details: `Logged maintenance ticket for ${asset.tag} (${asset.brand} ${asset.model}). Priority: ${ticket.priority}`,
          },
          ipAddress: '127.0.0.1',
        },
      });

      return ticket;
    });
  }

  async updateTicket(id: string, input: UpdateTicketInput) {
    await this.getTicketById(id); // Throws if not found

    return prisma.maintenanceTicket.update({
      where: { id },
      data: {
        technicianId: input.technicianId,
        priority: input.priority,
        status: input.status,
        description: input.description,
      },
      include: {
        asset: true,
      },
    });
  }

  async resolveTicket(id: string, input: ResolveTicketInput, resolverUserId: string) {
    const ticket = await this.getTicketById(id);

    if (ticket.status === TicketStatus.RESOLVED) {
      throw new Error('Ticket is already resolved');
    }

    const finalDescription = input.notes
      ? `${ticket.description} | Resolution Notes: ${input.notes}`
      : ticket.description;

    return prisma.$transaction(async (tx) => {
      // 1. Resolve ticket
      const updatedTicket = await tx.maintenanceTicket.update({
        where: { id },
        data: {
          status: TicketStatus.RESOLVED,
          cost: input.cost,
          resolvedAt: new Date(),
          description: finalDescription,
        },
        include: {
          asset: true,
        },
      });

      // 2. Update Asset status (AVAILABLE, RETIRED, etc.)
      await tx.asset.update({
        where: { id: ticket.assetId },
        data: { status: input.assetStatus },
      });

      // 3. Log Audit details
      await tx.auditLog.create({
        data: {
          userId: resolverUserId,
          action: 'MAINTENANCE_RESOLVE',
          targetTable: 'MaintenanceTicket',
          targetId: id,
          newValue: {
            details: `Resolved maintenance ticket for ${ticket.asset.tag}. Cost: $${input.cost}. Final asset status set to ${input.assetStatus}.`,
          },
          ipAddress: '127.0.0.1',
        },
      });

      return updatedTicket;
    });
  }
}
