import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { QueryOrderItemDto } from './dto/query-order-item.dto';
import { OrderItemResponseDto } from './dto/order-item-response.dto';

@Injectable()
export class OrderItemsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreateOrderItemDto): Promise<OrderItemResponseDto> {
    const item = await this.prisma.orderItem.create({ data: dto });
    return this.format(item);
  }

  async findAll(query: QueryOrderItemDto) {
    const {
      page = 1,
      limit = 10,
      orderId,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    const where: any = {};
    if (orderId) where.orderId = orderId;

    const [items, total] = await Promise.all([
      this.prisma.orderItem.findMany({
        where,
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: limit,
        include: {
          order: {
            select: {
              id: true,
              orderNumber: true,
            },
          },
          sku: {
            select: {
              id: true,
              sku: true,
              variant: {
                select: {
                  product: {
                    select: { name: true },
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.orderItem.count({ where }),
    ]);

    return {
      data: items.map(this.format),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findOne(id: string): Promise<OrderItemResponseDto> {
    const item = await this.prisma.orderItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException('Order item not found');
    return this.format(item);
  }

  async update(
    id: string,
    dto: UpdateOrderItemDto,
  ): Promise<OrderItemResponseDto> {
    const item = await this.prisma.orderItem.update({
      where: { id },
      data: dto,
    });
    return this.format(item);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.orderItem.delete({ where: { id } });
  }

  private format(item: any): OrderItemResponseDto {
    return {
      id: item.id,
      orderId: item.orderId,
      orderNumber: item.order?.orderNumber,
      skuId: item.skuId,
      skuCode: item.sku?.sku ?? item.skuCode,
      productName: item.sku?.variant?.product?.name ?? item.productName,
      quantity: item.quantity,
      unitPrice: item.unitPrice.toNumber?.() ?? item.unitPrice,
      totalPrice: item.totalPrice.toNumber?.() ?? item.totalPrice,
    };
  }
}
