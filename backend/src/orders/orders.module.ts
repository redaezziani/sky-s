import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PdfService } from 'src/common/services/pdf.service';
import { ImageKitService } from 'src/common/services/imagekit.service';
import { PaymentsModule } from 'src/payments/payments.module';

@Module({
  imports: [PaymentsModule],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService, PdfService, ImageKitService],
  exports: [OrdersService],
})
export class OrdersModule {}
