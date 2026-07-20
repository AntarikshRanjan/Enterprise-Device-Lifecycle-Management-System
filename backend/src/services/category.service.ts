import prisma from '../lib/prisma';

export interface CreateCategoryInput {
  name: string;
  description?: string;
}

export interface UpdateCategoryInput {
  name?: string;
  description?: string;
}

export class CategoryService {
  async getAllCategories() {
    return prisma.assetCategory.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getCategoryById(id: string) {
    const category = await prisma.assetCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new Error(`Category with ID ${id} not found`);
    }
    return category;
  }

  async createCategory(input: CreateCategoryInput) {
    const existing = await prisma.assetCategory.findUnique({
      where: { name: input.name },
    });
    if (existing) {
      throw new Error('Category name already exists');
    }
    return prisma.assetCategory.create({
      data: {
        name: input.name,
        description: input.description,
      },
    });
  }

  async updateCategory(id: string, input: UpdateCategoryInput) {
    await this.getCategoryById(id); // Throws if not found

    if (input.name) {
      const existing = await prisma.assetCategory.findUnique({
        where: { name: input.name },
      });
      if (existing && existing.id !== id) {
        throw new Error('Category name already exists');
      }
    }

    return prisma.assetCategory.update({
      where: { id },
      data: input,
    });
  }

  async deleteCategory(id: string) {
    await this.getCategoryById(id); // Throws if not found

    // Check if there are assets attached to this category
    const assetCount = await prisma.asset.count({
      where: { categoryId: id },
    });
    if (assetCount > 0) {
      throw new Error('Cannot delete category with associated assets');
    }

    return prisma.assetCategory.delete({
      where: { id },
    });
  }
}
