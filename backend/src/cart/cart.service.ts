import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartItemDto, SyncCartDto, AddToCartDto, UpdateCartItemDto } from './dto/cart.dto';

@Injectable()
export class CartService {
  constructor(private prisma: PrismaService) {}

  async getUserCart(userId: string): Promise<CartItemDto[]> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        sku: {
          include: {
            variant: {
              include: {
                product: true,
              },
            },
          },
        },
      },
    });

    return cartItems.map(item => ({
      id: item.id,
      skuId: item.skuId,
      quantity: item.quantity,
      productId: item.sku.variant.productId,
      productName: item.sku.variant.product.name,
      shortDesc: item.sku.variant.product.shortDesc || undefined,
      coverImage: item.sku.coverImage || item.sku.variant.product.coverImage || undefined,
      price: Number(item.sku.price),
      comparePrice: item.sku.comparePrice ? Number(item.sku.comparePrice) : undefined,
    }));
  }

  async syncCart(syncCartDto: SyncCartDto): Promise<CartItemDto[]> {
    const { userId, items } = syncCartDto;

    // Get existing cart items from DB
    const existingCartItems = await this.prisma.cartItem.findMany({
      where: { userId },
    });

    // Create a map for easy lookup
    const existingItemsMap = new Map(
      existingCartItems.map(item => [item.skuId, item])
    );

    // Process each item from frontend
    for (const item of items) {
      const existingItem = existingItemsMap.get(item.skuId);

      if (existingItem) {
        // Update existing item - combine quantities
        await this.prisma.cartItem.update({
          where: { id: existingItem.id },
          data: {
            quantity: existingItem.quantity + item.quantity,
          },
        });
      } else {
        // Create new item
        await this.prisma.cartItem.create({
          data: {
            userId,
            skuId: item.skuId,
            quantity: item.quantity,
          },
        });
      }
    }

    // Return updated cart
    return this.getUserCart(userId);
  }

  async addToCart(userId: string, addToCartDto: AddToCartDto): Promise<CartItemDto[]> {
    const { skuId, quantity } = addToCartDto;

    // Check if item already exists
    const existingItem = await this.prisma.cartItem.findUnique({
      where: {
        userId_skuId: {
          userId,
          skuId,
        },
      },
    });

    if (existingItem) {
      // Update quantity
      await this.prisma.cartItem.update({
        where: { id: existingItem.id },
        data: {
          quantity: existingItem.quantity + quantity,
        },
      });
    } else {
      // Create new item
      await this.prisma.cartItem.create({
        data: {
          userId,
          skuId,
          quantity,
        },
      });
    }

    return this.getUserCart(userId);
  }

  async updateCartItem(userId: string, updateCartItemDto: UpdateCartItemDto): Promise<CartItemDto[]> {
    const { skuId, quantity } = updateCartItemDto;

    if (quantity === 0) {
      // Remove item if quantity is 0
      await this.prisma.cartItem.deleteMany({
        where: {
          userId,
          skuId,
        },
      });
    } else {
      // Update quantity
      await this.prisma.cartItem.updateMany({
        where: {
          userId,
          skuId,
        },
        data: {
          quantity,
        },
      });
    }

    return this.getUserCart(userId);
  }

  async removeFromCart(userId: string, skuId: string): Promise<CartItemDto[]> {
    await this.prisma.cartItem.deleteMany({
      where: {
        userId,
        skuId,
      },
    });

    return this.getUserCart(userId);
  }

  async clearCart(userId: string): Promise<void> {
    await this.prisma.cartItem.deleteMany({
      where: { userId },
    });
  }

  async getCartItemCount(userId: string): Promise<number> {
    const result = await this.prisma.cartItem.aggregate({
      where: { userId },
      _sum: {
        quantity: true,
      },
    });

    return result._sum.quantity || 0;
  }

  async getCartSubtotal(userId: string): Promise<number> {
    const cartItems = await this.prisma.cartItem.findMany({
      where: { userId },
      include: {
        sku: true,
      },
    });

    return cartItems.reduce((total, item) => {
      return total + (Number(item.sku.price) * item.quantity);
    }, 0);
  }
}
