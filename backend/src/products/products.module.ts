import { Module } from '@nestjs/common';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { PrismaService } from '../prisma/prisma.service';
import { CommonModule } from '../common/common.module';
import { AuthModule } from '../auth/auth.module';
import { PublicProductsController } from './public/public-products.controller';
import { PublicProductsService } from './public/public-products.service';

@Module({
  imports: [CommonModule, AuthModule],
  controllers: [ProductsController, PublicProductsController],
  providers: [ProductsService, PrismaService, PublicProductsService],
  exports: [ProductsService, PublicProductsService],
})
export class ProductsModule {}
