import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrderResponseDto } from './dto/order-response.dto';
import { CreateOrderDto, OrderItemDto } from './dto/create-order.dto';
import { UpdateOrderDto } from './dto/update-order.dto';
import { Decimal } from 'generated/prisma/runtime/index-browser';
import { QueryOrderDto } from './dto/query-order.dto';
import { PdfService } from 'src/common/services/pdf.service';
import { ImageKitService } from 'src/common/services/imagekit.service';

@Injectable()
export class OrdersService {
  constructor(
    private prisma: PrismaService,
    private pdfService: PdfService,
    private imageKitService: ImageKitService,
  ) {}

  private async generateOrderNumber(): Promise<string> {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000)
      .toString()
      .padStart(3, '0');
    return `ORD-${timestamp}-${random}`;
  }

  async create(
    createOrderDto: CreateOrderDto,
  ): Promise<OrderResponseDto & { pdfUrl: string }> {
    const orderNumber = await this.generateOrderNumber();

    // Batch fetch SKUs
    const skuIds = createOrderDto.items.map((i) => i.skuId);
    const skus = await this.prisma.productSKU.findMany({
      where: { id: { in: skuIds } },
      include: { variant: { include: { product: true } } },
    });

    if (skus.length !== skuIds.length) {
      const foundIds = skus.map((s) => s.id);
      const missingIds = skuIds.filter((id) => !foundIds.includes(id));
      throw new NotFoundException(`SKU(s) not found: ${missingIds.join(', ')}`);
    }

    let subtotal = new Decimal(0);

    const itemsData = createOrderDto.items.map((item: OrderItemDto) => {
      const sku = skus.find((s) => s.id === item.skuId)!;
      const unitPrice = new Decimal(sku.price.toString());
      const totalPrice = unitPrice.mul(item.quantity);
      subtotal = subtotal.plus(totalPrice);

      return {
        skuId: sku.id,
        quantity: item.quantity,
        unitPrice,
        totalPrice,
        productName: sku.variant.product.name,
        skuCode: sku.sku,
      };
    });

    // Placeholder: calculate tax, shipping, discounts as needed
    const taxAmount = new Decimal(0);
    const shippingAmount = new Decimal(0);
    const discountAmount = new Decimal(0);
    const totalAmount = subtotal
      .plus(taxAmount)
      .plus(shippingAmount)
      .minus(discountAmount);

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
        shippingName: createOrderDto.shippingName ?? 'n/a',
        shippingEmail: createOrderDto.shippingEmail ?? 'n/a',
        shippingPhone: createOrderDto.shippingPhone ?? 'n/a',
        shippingAddress: createOrderDto.shippingAddress ?? 'n/a',
        billingName: createOrderDto.billingName ?? null,
        billingEmail: createOrderDto.billingEmail ?? null,
        billingAddress: createOrderDto.billingAddress ?? undefined,
        notes: createOrderDto.notes ?? null,
        trackingNumber: createOrderDto.trackingNumber ?? null,

        // Delivery info only at order level
        deliveryLat: createOrderDto.deliveryLat ?? null,
        deliveryLng: createOrderDto.deliveryLng ?? null,
        deliveryPlace: createOrderDto.deliveryPlace ?? null,

        invoiceUrl: '',
        invoiceFileId: '',
        items: {
          create: itemsData,
        },
      },
      include: { items: true },
    });

    const { url, fileId } = await this.pdfService.generateOrderPdf({
      ...order,
      items: order.items.map((i) => ({
        ...i,
        name: i.productName,
        quantity: i.quantity,
        totalPrice: i.totalPrice.toNumber(),
      })),
    });

    // Update order with invoice URL and fileId
    await this.prisma.order.update({
      where: { id: order.id },
      data: { invoiceUrl: url, invoiceFileId: fileId },
    });

    return { ...this.formatOrderResponse(order), pdfUrl: url };
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

    const where: any = {};
    if (search) {
      where.OR = [
        { orderNumber: { contains: search, mode: 'insensitive' } },
        { userId: { contains: search, mode: 'insensitive' } },
      ];
    }
    if (status) where.status = status;

    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    const [orders, total] = await Promise.all([
      this.prisma.order.findMany({
        where,
        include: {
          items: {
            include: {
              sku: {
                include: {
                  // Include main SKU cover image and all images
                  images: true,
                },
              },
            },
          },
          user: true, // if you want user details
        },
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
    // 1. Fetch existing order with items
    const order = await this.prisma.order.findUnique({
      where: { id },
      include: { items: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    const data: any = { ...updateOrderDto };

    if (updateOrderDto.items && updateOrderDto.items.length > 0) {
      const skuIds = updateOrderDto.items.map((i) => i.skuId);
      const skus = await this.prisma.productSKU.findMany({
        where: { id: { in: skuIds } },
        include: { variant: { include: { product: true } } },
      });

      if (skus.length !== skuIds.length) {
        const foundIds = skus.map((s) => s.id);
        const missingIds = skuIds.filter((id) => !foundIds.includes(id));
        throw new NotFoundException(
          `SKU(s) not found: ${missingIds.join(', ')}`,
        );
      }

      let subtotal = new Decimal(0);

      const itemsData = updateOrderDto.items.map((item) => {
        const sku = skus.find((s) => s.id === item.skuId)!;
        const unitPrice = new Decimal(sku.price.toString());
        const totalPrice = unitPrice.mul(item.quantity);
        subtotal = subtotal.plus(totalPrice);

        return {
          skuId: sku.id,
          quantity: item.quantity,
          unitPrice,
          totalPrice,
          productName: sku.variant.product.name,
          skuCode: sku.sku,
        };
      });

      // Placeholder: recalc tax, shipping, discount if needed
      const taxAmount = order.taxAmount;
      const shippingAmount = order.shippingAmount;
      const discountAmount = order.discountAmount;
      const totalAmount = subtotal
        .plus(taxAmount)
        .plus(shippingAmount)
        .minus(discountAmount);

      data.subtotal = subtotal;
      data.totalAmount = totalAmount;

      // Replace existing items
      await this.prisma.orderItem.deleteMany({ where: { orderId: id } });
      data.items = { create: itemsData };
    }

    // 4. Update order
    const updatedOrder = await this.prisma.order.update({
      where: { id },
      data,
      include: { items: true },
    });
    // lets delete old invoice and generate a new one
    if (order.invoiceFileId) {
      await this.imageKitService.deleteImage(order.invoiceFileId);
    }
    const { url, fileId } = await this.pdfService.generateOrderPdf({
      ...updatedOrder,
      items: updatedOrder.items.map((i) => ({
        ...i,
        name: i.productName,
        quantity: i.quantity,
        totalPrice: i.totalPrice.toNumber(),
      })),
    });
    await this.prisma.order.update({
      where: { id: updatedOrder.id },
      data: { invoiceUrl: url, invoiceFileId: fileId },
    });

    return this.formatOrderResponse(updatedOrder);
  }

  async remove(id: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id },
    });
    if (!order) throw new NotFoundException('Order not found');
    await this.prisma.order.delete({ where: { id } });
    if (order.invoiceFileId)
      await this.imageKitService.deleteImage(order.invoiceFileId);
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

      // delivery info at order level
      deliveryLat: order.deliveryLat ?? null,
      deliveryLng: order.deliveryLng ?? null,
      deliveryPlace: order.deliveryPlace ?? null,

      items: order.items.map((item) => ({
        id: item.id,
        skuId: item.skuId,
        productName: item.productName,
        skuCode: item.skuCode,
        quantity: item.quantity,
        unitPrice: item.unitPrice.toNumber(),
        totalPrice: item.totalPrice.toNumber(),

        // include SKU details and images
        sku: item.sku
          ? {
              id: item.sku.id,
              sku: item.sku.sku,
              price: item.sku.price.toNumber(),
              coverImage: item.sku.coverImage,
              images:
                item.sku.images?.map((img) => ({
                  id: img.id,
                  url: img.url,
                  altText: img.altText,
                })) || [],
            }
          : undefined,
      })),
    };
  }
}
