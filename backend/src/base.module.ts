import { Module } from '@nestjs/common';
import { AuthModule } from './auth/auth.module';
import { ProductsModule } from './products/products.module';
import { CategoriesModule } from './categories/categories.module';
import { CommonModule } from './common/common.module';
import { UsersModule } from './users/users.module';
import { OrdersModule } from './orders/orders.module';
import { BarcodeModule } from './barcode/barcode.module';
import { OrderItemsModule } from './order-items/order-items.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { PaymentsModule } from './payments/payments.module';
import { SettingsModule } from './settings/settings.module';
import { EventEmitterModule } from '@nestjs/event-emitter';

@Module({
  imports: [
    AuthModule,
    ProductsModule,
    CategoriesModule,
    CommonModule,
    UsersModule,
    OrdersModule,
    BarcodeModule,
    OrderItemsModule,
    AnalyticsModule,
    PaymentsModule,
    SettingsModule,
    EventEmitterModule.forRoot(),
  ],
  controllers: [],
  providers: [],
})
export class BaseModule {}
