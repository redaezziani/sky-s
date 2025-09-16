import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderResponseDto } from './dto/order-response.dto';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { ProductSKU } from 'generated/prisma';
import { Decimal } from 'generated/prisma/runtime/index-browser';
import { QueryOrderDto } from './dto/query-order.dto';

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  private async generateOrderNumber(): Promise<string> {
    const count = await this.prisma.order.count();
    return `ORD-${(count + 1).toString().padStart(6, '0')}`;
  }

  async create(createOrderDto: CreateOrderDto): Promise<OrderResponseDto> {
    const orderNumber = await this.generateOrderNumber();

    let subtotal = 0;
    const itemsData: {
      skuId: string;
      quantity: number;
      unitPrice: Decimal;
      totalPrice: number;
      productName: string;
      skuCode: string;
    }[] = [];

    for (const item of createOrderDto.items) {
      const sku = await this.prisma.productSKU.findUnique({
        where: { id: item.skuId },
        include: { variant: { include: { product: true } } },
      });

      if (!sku) throw new NotFoundException(`SKU ${item.skuId} not found`);

      const totalPrice = sku.price.toNumber() * item.quantity;
      subtotal += totalPrice;

      itemsData.push({
        skuId: sku.id,
        quantity: item.quantity,
        unitPrice: sku.price,
        totalPrice,
        productName: sku.variant.product.name,
        skuCode: sku.sku,
      });
    }

    const taxAmount = 0;
    const shippingAmount = 0;
    const discountAmount = 0;
    const totalAmount = subtotal + taxAmount + shippingAmount - discountAmount;

    const order = await this.prisma.order.create({
      data: {
        orderNumber,
        userId: createOrderDto.userId,
        subtotal,
        taxAmount,
        shippingAmount,
        discountAmount,
        totalAmount,
        currency: 'USD',
        shippingName: createOrderDto.shippingName ?? '',
        shippingEmail: createOrderDto.shippingEmail ?? '',
        shippingPhone: createOrderDto.shippingPhone ?? '',
        shippingAddress: createOrderDto.shippingAddress ?? '',
        billingName: createOrderDto.billingName ?? '',
        billingEmail: createOrderDto.billingEmail ?? '',
        billingAddress: createOrderDto.billingAddress ?? '',
        notes: createOrderDto.notes ?? '',
        trackingNumber: createOrderDto.trackingNumber ?? '',
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });

    return this.formatOrderResponse(order);
  }

  async findAll(query: QueryOrderDto): Promise<{
    data: OrderResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      status,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = query;
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    // Order by
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Fetch orders and total count
    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: { items: true },
        orderBy,
        skip,
        take: limit,
      }),
      this.prisma.order.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      data: orders.map(this.formatOrderResponse),
      total,
      page,
      limit,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    };
  }

  async findOne(id: string): Promise<OrderResponseDto> {
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!order) throw new NotFoundException('Order not found');

    return this.formatOrderResponse(order);
  }

  async update(
    id: string,
    updateOrderDto: UpdateOrderDto,
  ): Promise<OrderResponseDto> {
    const order = await this.prisma.order.update({
      where: { id },
      data: updateOrderDto,
      include: { items: true },
    });

    return this.formatOrderResponse(order);
  }

  async remove(id: string): Promise<void> {
    await this.prisma.order.delete({ where: { id } });
  }

  private formatOrderResponse(order: any): OrderResponseDto {
    return {
      id: order.id,
      orderNumber: order.orderNumber,
      userId: order.userId,
      status: order.status,
      paymentStatus: order.paymentStatus,
      subtotal: order.subtotal.toNumber(),
      taxAmount: order.taxAmount.toNumber(),
      shippingAmount: order.shippingAmount.toNumber(),
      discountAmount: order.discountAmount.toNumber(),
      totalAmount: order.totalAmount.toNumber(),
      currency: order.currency,
      shippingName: order.shippingName,
      shippingEmail: order.shippingEmail,
      shippingPhone: order.shippingPhone,
      shippingAddress: order.shippingAddress,
      billingName: order.billingName,
      billingEmail: order.billingEmail,
      billingAddress: order.billingAddress,
      notes: order.notes,
      trackingNumber: order.trackingNumber,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      items: order.items.map((item) => ({
        id: item.id,
        skuId: item.skuId,
        productName: item.productName,
        skuCode: item.skuCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),
        sku: item.sku,
      })),
    };
  }
}
