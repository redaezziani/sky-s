import { z } from 'zod';

export const SKUQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sortBy: z.enum(['sku', 'price', 'stock', 'createdAt', 'updatedAt']).optional().default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
  isActive: z.coerce.boolean().optional(),
  inStock: z.coerce.boolean().optional(),
  lowStock: z.coerce.boolean().optional(),
  minPrice: z.coerce.number().min(0).optional(),
  maxPrice: z.coerce.number().min(0).optional(),
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
  includeProduct: z.coerce.boolean().optional().default(false),
  includeVariant: z.coerce.boolean().optional().default(false),
  includeImages: z.coerce.boolean().optional().default(false),
});

export type SKUQueryDto = z.infer<typeof SKUQuerySchema>;
