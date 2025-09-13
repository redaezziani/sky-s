import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';

@Module({
  imports: [AuthModule, ProductsModule, CategoriesModule],
  controllers: [],
  providers: [],
})
export class BaseModule {}
