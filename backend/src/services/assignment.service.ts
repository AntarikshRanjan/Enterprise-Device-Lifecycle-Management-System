import prisma from '../lib/prisma';
import { AssetStatus, AssignmentStatus, Prisma } from '@prisma/client';

export interface CheckoutInput {
  assetId: string;
  userId: string;
  assignedById: string;
  assignedAt?: Date | string;
  returnNotes?: string;
}

export interface ReturnInput {
  notes?: string;
}

export interface GetAssignmentsFilter {
  status?: AssignmentStatus;
  userId?: string;
  assetId?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export class AssignmentService {
  async getAllAssignments(filter: GetAssignmentsFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AssignmentWhereInput = {};

    if (filter.status) {
      where.status = filter.status;
    }
    if (filter.userId) {
      where.userId = filter.userId;
    }
    if (filter.assetId) {
      where.assetId = filter.assetId;
    }

    if (filter.search) {
      where.OR = [
        {
          asset: {
            OR: [
              { tag: { contains: filter.search, mode: 'insensitive' } },
              { brand: { contains: filter.search, mode: 'insensitive' } },
              { model: { contains: filter.search, mode: 'insensitive' } },
            ],
          },
        },
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

    const [total, assignments] = await Promise.all([
      prisma.assignment.count({ where }),
      prisma.assignment.findMany({
        where,
        orderBy: { assignedAt: 'desc' },
        skip,
        take: limit,
        include: {
          asset: {
            include: {
              category: true,
            },
          },
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
            },
          },
          assignedBy: {
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
      assignments,
    };
  }

  async checkoutAsset(input: CheckoutInput) {
    // 1. Verify Asset availability
    const asset = await prisma.asset.findUnique({
      where: { id: input.assetId },
    });
    if (!asset) {
      throw new Error(`Asset with ID ${input.assetId} not found`);
    }
    if (asset.status !== AssetStatus.AVAILABLE) {
      throw new Error(
        `Asset ${asset.tag} is not available for checkout (current status: ${asset.status})`,
      );
    }

    // 2. Verify targeted User exists
    const employee = await prisma.user.findUnique({
      where: { id: input.userId },
    });
    if (!employee) {
      throw new Error(`Targeted employee with ID ${input.userId} not found`);
    }

    // 3. Process database transaction
    return prisma.$transaction(async (tx) => {
      // Create checkout assignment row
      const assignment = await tx.assignment.create({
        data: {
          assetId: input.assetId,
          userId: input.userId,
          assignedById: input.assignedById,
          assignedAt: input.assignedAt ? new Date(input.assignedAt) : new Date(),
          status: AssignmentStatus.ACTIVE,
          returnNotes: input.returnNotes,
        },
        include: {
          asset: true,
          user: true,
        },
      });

      // Update Asset status to ASSIGNED
      await tx.asset.update({
        where: { id: input.assetId },
        data: { status: AssetStatus.ASSIGNED },
      });

      // Create Audit Log entry
      await tx.auditLog.create({
        data: {
          userId: input.assignedById,
          action: 'CHECKOUT',
          targetTable: 'Assignment',
          targetId: assignment.id,
          newValue: {
            details: `Checked out asset ${asset.tag} (${asset.brand} ${asset.model}) to ${employee.firstName} ${employee.lastName}.`,
          },
          ipAddress: '127.0.0.1',
        },
      });

      return assignment;
    });
  }

  async returnAsset(assignmentId: string, input: ReturnInput) {
    // 1. Verify assignment active status
    const assignment = await prisma.assignment.findUnique({
      where: { id: assignmentId },
      include: {
        asset: true,
        user: true,
      },
    });

    if (!assignment) {
      throw new Error(`Assignment record with ID ${assignmentId} not found`);
    }
    if (assignment.status === AssignmentStatus.RETURNED) {
      throw new Error('Asset has already been returned for this assignment record');
    }

    // 2. Process database transaction
    return prisma.$transaction(async (tx) => {
      // Mark assignment returned
      const updatedAssignment = await tx.assignment.update({
        where: { id: assignmentId },
        data: {
          status: AssignmentStatus.RETURNED,
          returnedAt: new Date(),
          returnNotes: input.notes
            ? `${assignment.returnNotes || ''} | Return Notes: ${input.notes}`
            : assignment.returnNotes,
        },
        include: {
          asset: true,
          user: true,
        },
      });

      // Update Asset status back to AVAILABLE
      await tx.asset.update({
        where: { id: assignment.assetId },
        data: { status: AssetStatus.AVAILABLE },
      });

      // Create Audit Log entry
      await tx.auditLog.create({
        data: {
          userId: assignment.assignedById,
          action: 'RETURN',
          targetTable: 'Assignment',
          targetId: assignmentId,
          newValue: {
            details: `Processed return of asset ${assignment.asset.tag} from ${assignment.user.firstName} ${assignment.user.lastName}.`,
          },
          ipAddress: '127.0.0.1',
        },
      });

      return updatedAssignment;
    });
  }
}
