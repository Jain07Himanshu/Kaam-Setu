import { Request, Response } from 'express';
import { prisma } from '../../database/prisma.js';

export async function getCategories(req: Request, res: Response) {
  try {
    const categories = await prisma.serviceCategory.findMany({
      where: { active: true },
      orderBy: { name: 'asc' },
    });
    return res.json({ categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return res.status(500).json({ error: 'Failed to fetch service categories' });
  }
}

export async function getCategoryBySlug(req: Request, res: Response) {
  try {
    const { slug } = req.params;
    const category = await prisma.serviceCategory.findUnique({
      where: { slug },
      include: {
        workerServices: {
          include: {
            worker: {
              include: {
                user: true,
                verifications: true,
              },
            },
          },
        },
      },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    return res.json({ category });
  } catch (error) {
    console.error('Error fetching category by slug:', error);
    return res.status(500).json({ error: 'Failed to fetch category details' });
  }
}
