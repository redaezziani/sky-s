import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';

@Module({
  imports: [
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CommonModule,
    UsersModule,
    OrdersModule],
  controllers: [],
  providers: [],
})
export class BaseModule {}
