import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AnalyticsCardDto } from './dto/analytics.dto';
import { subDays, format } from 'date-fns';
import { TopProductsDto } from './dto/analytics-top-products.dto';
@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  // private calculateGrowth(current: number, previous: number): number {
  //   if (previous === 0) return 100;
  //   return ((current - previous) / previous) * 100;
  // }

  async getAnalyticsCards(period: number): Promise<AnalyticsCardDto[]> {
    const now = new Date();
    const startCurrent = subDays(now, period);
    const startPrevious = subDays(now, period * 2);
    const endPrevious = startCurrent;

    // --- Total Orders ---
    const totalOrdersCurrent = await this.prisma.order.count({
      where: { createdAt: { gte: startCurrent } },
    });
    const totalOrdersPrevious = await this.prisma.order.count({
      where: { createdAt: { gte: startPrevious, lt: endPrevious } },
    });

    // --- Total Revenue ---
    const revenueCurrent = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: { createdAt: { gte: startCurrent }, status: { not: 'CANCELLED' } },
    });
    const revenuePrevious = await this.prisma.order.aggregate({
      _sum: { totalAmount: true },
      where: {
        createdAt: { gte: startPrevious, lt: endPrevious },
        status: { not: 'CANCELLED' },
      },
    });

    // --- Active Users ---
    const activeUsersCurrent = await this.prisma.user.count({
      where: { lastLoginAt: { gte: startCurrent }, isActive: true },
    });
    const activeUsersPrevious = await this.prisma.user.count({
      where: {
        lastLoginAt: { gte: startPrevious, lt: endPrevious },
        isActive: true,
      },
    });

    // --- Products Sold ---
    const productsSoldCurrent = await this.prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: {
          createdAt: { gte: startCurrent },
          status: { not: 'CANCELLED' },
        },
      },
    });
    const productsSoldPrevious = await this.prisma.orderItem.aggregate({
      _sum: { quantity: true },
      where: {
        order: {
          createdAt: { gte: startPrevious, lt: endPrevious },
          status: { not: 'CANCELLED' },
        },
      },
    });

    return [
      {
        title: 'Total Orders',
        count: totalOrdersCurrent,
        growth: this.calculateGrowth(totalOrdersCurrent, totalOrdersPrevious),
        description: `Orders placed in the last ${period} days`,
      },
      {
        title: 'Revenue',
        count: revenueCurrent._sum.totalAmount?.toNumber() || 0,
        growth: this.calculateGrowth(
          revenueCurrent._sum.totalAmount?.toNumber() || 0,
          revenuePrevious._sum.totalAmount?.toNumber() || 0,
        ),
        description: `Revenue generated in the last ${period} days`,
      },
      {
        title: 'Active Users',
        count: activeUsersCurrent,
        growth: this.calculateGrowth(activeUsersCurrent, activeUsersPrevious),
        description: `Users who logged in within the last ${period} days`,
      },
      {
        title: 'Products Sold',
        count: productsSoldCurrent._sum.quantity || 0,
        growth: this.calculateGrowth(
          productsSoldCurrent._sum.quantity || 0,
          productsSoldPrevious._sum.quantity || 0,
        ),
        description: `Total products sold in the last ${period} days`,
      },
    ];
  }

  async getChartData(period: number) {
    const startDate = subDays(new Date(), period);

    // Fetch all delivered & completed orders within the period
    const orders = await this.prisma.order.findMany({
      where: {
        createdAt: { gte: startDate },
        status: 'DELIVERED',
        paymentStatus: 'COMPLETED',
      },
      include: {
        items: true, // include order items to calculate products sold
      },
      orderBy: { createdAt: 'asc' },
    });

    // Initialize data object for all dates
    const data: Record<string, any> = {};
    for (let i = 0; i <= period; i++) {
      const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
      data[date] = { date, orders: 0, revenue: 0, products: 0 };
    }

    // Aggregate orders, revenue, and products per day
    orders.forEach((order) => {
      const date = format(order.createdAt, 'yyyy-MM-dd');
      data[date].orders += 1;
      data[date].revenue += Number(order.totalAmount);
      data[date].products +=
        order.items?.reduce((sum, item) => sum + item.quantity, 0) || 0;
    });

    // Return sorted array
    return Object.values(data).sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
    );
  }

  async getTopProducts(period: number): Promise<TopProductsDto[]> {
    const results = await this.prisma.orderItem.groupBy({
      by: ['productName'],
      _sum: { quantity: true },
      where: {
        order: {
          createdAt: {
            gte: new Date(Date.now() - period * 24 * 60 * 60 * 1000),
          },
        },
      },
      orderBy: { _sum: { quantity: 'desc' } },
      take: 10,
    });

    return results.map((r) => ({
      productName: r.productName,
      totalOrdered: r._sum.quantity ?? 0, // <- coerce null to 0
    }));
  }

  calculateGrowth(current: number, previous: number) {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  }
}
