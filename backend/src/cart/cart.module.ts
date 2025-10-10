import { Module } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CartController, PublicCartController } from './cart.controller';
import { CartService } from './cart.service';

@Module({
  imports: [],
  controllers: [CartController, PublicCartController],
  providers: [CartService
    , PrismaService],
  exports: [CartService],
})
export class CartModule {}
