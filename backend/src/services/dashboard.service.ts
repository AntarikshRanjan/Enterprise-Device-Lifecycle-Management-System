import prisma from '../lib/prisma';
import { AssetStatus, TicketStatus } from '@prisma/client';

export class DashboardService {
  async getDashboardSummary() {
    // 1. Fetch count of assets by status
    const [total, available, assigned, maintenance, retired] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: AssetStatus.AVAILABLE } }),
      prisma.asset.count({ where: { status: AssetStatus.ASSIGNED } }),
      prisma.asset.count({ where: { status: AssetStatus.MAINTENANCE } }),
      prisma.asset.count({ where: { status: AssetStatus.RETIRED } }),
    ]);

    // 2. Fetch category splits
    const categoriesRaw = await prisma.assetCategory.findMany({
      include: {
        _count: {
          select: { assets: true },
        },
      },
    });

    const categorySplit = categoriesRaw.map((c) => ({
      categoryId: c.id,
      name: c.name,
      count: c._count.assets,
    }));

    // 3. Fetch maintenance summary
    const resolvedTickets = await prisma.maintenanceTicket.findMany({
      where: { status: TicketStatus.RESOLVED },
      select: { cost: true },
    });

    const totalMaintenanceCost = resolvedTickets.reduce((sum, ticket) => {
      if (ticket.cost) {
        return sum + Number(ticket.cost);
      }
      return sum;
    }, 0);

    const activeTicketsCount = await prisma.maintenanceTicket.count({
      where: {
        status: {
          in: [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS],
        },
      },
    });

    // 4. Fetch recent activity (Audit logs)
    const recentLogs = await prisma.auditLog.findMany({
      orderBy: { timestamp: 'desc' },
      take: 8,
      include: {
        user: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    const recentActivities = recentLogs.map((log) => {
      let description = '';
      if (log.newValue && typeof log.newValue === 'object' && 'details' in log.newValue) {
        description = (log.newValue as { details: string }).details;
      } else {
        description = `${log.action} performed on ${log.targetTable}`;
      }

      return {
        id: log.id,
        action: log.action,
        timestamp: log.timestamp,
        actor: log.user ? `${log.user.firstName} ${log.user.lastName}` : 'System',
        description,
      };
    });

    return {
      stats: {
        total,
        available,
        assigned,
        maintenance,
        retired,
      },
      categorySplit,
      maintenanceSummary: {
        totalCost: totalMaintenanceCost,
        activeTickets: activeTicketsCount,
      },
      recentActivities,
    };
  }
}
