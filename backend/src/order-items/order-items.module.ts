import { Module } from '@nestjs/common';
import { OrderItemsService } from './order-items.service';
import { OrderItemsController } from './order-items.controller';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [OrderItemsController],
  providers: [OrderItemsService, PrismaService],
  exports: [OrderItemsService],
})
export class OrderItemsModule {}
