import prisma from '../lib/prisma';
import { AssetStatus, Prisma } from '@prisma/client';

export interface GetAssetsFilter {
  search?: string;
  categoryId?: string;
  status?: AssetStatus;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateAssetInput {
  tag?: string;
  serialNumber: string;
  brand: string;
  model: string;
  categoryId: string;
  purchaseDate: Date | string;
  vendorId?: string | null;
  cost: number;
  warrantyExpiry?: Date | string | null;
  status?: AssetStatus;
  imageUrl?: string | null;
}

export interface UpdateAssetInput {
  tag?: string;
  serialNumber?: string;
  brand?: string;
  model?: string;
  categoryId?: string;
  purchaseDate?: Date | string;
  vendorId?: string | null;
  cost?: number;
  warrantyExpiry?: Date | string | null;
  status?: AssetStatus;
  imageUrl?: string | null;
}

export class AssetService {
  async getAllAssets(filter: GetAssetsFilter) {
    const page = filter.page || 1;
    const limit = filter.limit || 10;
    const skip = (page - 1) * limit;

    const where: Prisma.AssetWhereInput = {};

    // 1. Search Query mapping
    if (filter.search) {
      where.OR = [
        { tag: { contains: filter.search, mode: 'insensitive' } },
        { serialNumber: { contains: filter.search, mode: 'insensitive' } },
        { brand: { contains: filter.search, mode: 'insensitive' } },
        { model: { contains: filter.search, mode: 'insensitive' } },
      ];
    }

    // 2. Exact Filters
    if (filter.categoryId) {
      where.categoryId = filter.categoryId;
    }
    if (filter.status) {
      where.status = filter.status;
    }

    // 3. Sorting config
    const sortBy = filter.sortBy || 'createdAt';
    const sortOrder = filter.sortOrder || 'desc';
    const orderBy = { [sortBy]: sortOrder } as Prisma.AssetOrderByWithRelationInput;

    // 4. Queries execution
    const [total, assets] = await Promise.all([
      prisma.asset.count({ where }),
      prisma.asset.findMany({
        where,
        orderBy,
        skip,
        take: limit,
        include: {
          category: true,
          vendor: true,
        },
      }),
    ]);

    return {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      assets,
    };
  }

  async getAssetById(id: string) {
    const asset = await prisma.asset.findUnique({
      where: { id },
      include: {
        category: true,
        vendor: true,
      },
    });

    if (!asset) {
      throw new Error(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  async createAsset(input: CreateAssetInput) {
    // Check serialNumber duplicate
    const existing = await prisma.asset.findUnique({
      where: { serialNumber: input.serialNumber },
    });
    if (existing) {
      throw new Error(`Asset with serial number ${input.serialNumber} already exists`);
    }

    // Resolve tag if not explicitly set
    let tag = input.tag;
    if (!tag) {
      const lastAsset = await prisma.asset.findFirst({
        orderBy: { tag: 'desc' },
      });
      let nextNum = 1;
      if (lastAsset && lastAsset.tag.startsWith('AST-')) {
        const numStr = lastAsset.tag.split('-')[1];
        const num = parseInt(numStr, 10);
        if (!isNaN(num)) {
          nextNum = num + 1;
        }
      }
      tag = `AST-${String(nextNum).padStart(4, '0')}`;
    } else {
      // Validate user provided tag uniqueness
      const existingTag = await prisma.asset.findUnique({
        where: { tag },
      });
      if (existingTag) {
        throw new Error(`Asset with tag ${tag} already exists`);
      }
    }

    return prisma.asset.create({
      data: {
        tag,
        serialNumber: input.serialNumber,
        brand: input.brand,
        model: input.model,
        categoryId: input.categoryId,
        purchaseDate: new Date(input.purchaseDate),
        vendorId: input.vendorId,
        cost: input.cost,
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : null,
        status: input.status || AssetStatus.AVAILABLE,
        imageUrl: input.imageUrl,
      },
      include: {
        category: true,
        vendor: true,
      },
    });
  }

  async updateAsset(id: string, input: UpdateAssetInput) {
    await this.getAssetById(id); // Throws if not found

    if (input.serialNumber) {
      const existing = await prisma.asset.findUnique({
        where: { serialNumber: input.serialNumber },
      });
      if (existing && existing.id !== id) {
        throw new Error(`Asset with serial number ${input.serialNumber} already exists`);
      }
    }

    if (input.tag) {
      const existingTag = await prisma.asset.findUnique({
        where: { tag: input.tag },
      });
      if (existingTag && existingTag.id !== id) {
        throw new Error(`Asset with tag ${input.tag} already exists`);
      }
    }

    return prisma.asset.update({
      where: { id },
      data: {
        ...input,
        purchaseDate: input.purchaseDate ? new Date(input.purchaseDate) : undefined,
        warrantyExpiry: input.warrantyExpiry ? new Date(input.warrantyExpiry) : undefined,
      },
      include: {
        category: true,
        vendor: true,
      },
    });
  }

  async deleteAsset(id: string) {
    await this.getAssetById(id); // Throws if not found

    // Check if the asset has active assignments
    const activeAssignments = await prisma.assignment.count({
      where: { assetId: id, status: 'ACTIVE' },
    });
    if (activeAssignments > 0) {
      throw new Error('Cannot delete asset with active assignments');
    }

    return prisma.asset.delete({
      where: { id },
    });
  }
}
