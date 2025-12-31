'use client';

import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Eye } from 'lucide-react';
import { Order } from '@/stores/orders-store';
import DeliveryMapPicker from '../delivery-map-picker';
import { useLocale } from '@/components/local-lang-swither';
import { getMessages } from '@/lib/locale';

interface OrderDetailsProps {
  order: Order;
}

export default function OrderDetails({ order }: OrderDetailsProps) {
  const { locale } = useLocale();
  const t = getMessages(locale).pages.orders.dialogs.orderDetails;

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: 'MAD',
    }).format(amount);

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="sm" className="flex items-center gap-3">
          <Eye className="h-4 w-4" />
          {t.viewDetails}
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full px-4 sm:min-w-167.5 lg:w-175 xl:w-225 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>
            {t.title.replace('{orderNumber}', order.orderNumber)}
          </SheetTitle>
        </SheetHeader>

        <div className="space-y-6 py-4">
          {/* General Info */}
          <section>
            <h3 className="text-lg font-semibold">{t.sections.generalInfo}</h3>
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <p className="text-muted-foreground">{t.fields.status}</p>
                <Badge className="mt-1" variant="secondary">
                  {order.status}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">{t.fields.payment}</p>
                <Badge className="mt-1" variant="secondary">
                  {order.paymentStatus}
                </Badge>
              </div>
              <div>
                <p className="text-muted-foreground">{t.fields.createdAt}</p>
                <p>{new Date(order.createdAt).toLocaleString(locale)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  {t.fields.updatedAt || 'Updated At'}
                </p>
                <p>{new Date(order.updatedAt).toLocaleString(locale)}</p>
              </div>
              {order.confirmedBy && (
                <div>
                  <p className="text-muted-foreground">
                    {t.fields.confirmedBy || 'Confirmed By'}
                  </p>
                  <p>{order.confirmedBy.name || order.confirmedBy.email}</p>
                </div>
              )}
              {order.confirmedAt && (
                <div>
                  <p className="text-muted-foreground">
                    {t.fields.confirmedAt || 'Confirmed At'}
                  </p>
                  <p>{new Date(order.confirmedAt).toLocaleString(locale)}</p>
                </div>
              )}
            </div>
          </section>

          <Separator />

          {/* Customer Info */}
          <section>
            <h3 className="text-lg font-semibold">
              {t.sections.customerInfo || 'Customer Information'}
            </h3>
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <p className="text-muted-foreground">
                  {t.fields.customerName || 'Customer Name'}
                </p>
                <p>{order.customerName}</p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  {t.fields.customerPhone || 'Phone'}
                </p>
                <p>{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-muted-foreground">
                  {t.fields.customerEmail || 'Email'}
                </p>
                <p>{order.customerEmail || '-'}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">
                  {t.fields.customerAddress || 'Address'}
                </p>
                <pre className="bg-muted p-2 rounded text-xs overflow-x-auto">
                  {order.customerAddress
                    ? JSON.stringify(order.customerAddress, null, 2)
                    : '-'}
                </pre>
              </div>
            </div>
          </section>

          <Separator />

          {/* Items */}
          <section>
            <h3 className="text-lg font-semibold">{t.sections.items}</h3>
            <div className="mt-2 border rounded-md divide-y">
              {order.items.map((item) => (
                <div
                  key={item.skuId}
                  className="flex justify-between items-center p-3 text-sm gap-4"
                >
                  <div className="w-16 h-16 shrink-0">
                    <img
                      src={item.sku?.coverImage || '/placeholder.png'}
                      alt={item.productName}
                      className="w-full h-full object-cover rounded"
                    />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-muted-foreground text-xs">
                      {item.skuCode}
                    </p>
                    <p className="text-xs">
                      {t.labels.qty.replace('{qty}', String(item.quantity))} ×{' '}
                      {formatCurrency(item.unitPrice)}
                    </p>
                  </div>
                  <p className="font-medium">
                    {formatCurrency(item.totalPrice)}
                  </p>
                </div>
              ))}
            </div>
          </section>

          <Separator />
          {/* Delivery Map */}
          {order.deliveryLat && order.deliveryLng && (
            <section>
              <h3 className="text-lg font-semibold mb-2">
                {t.sections.deliveryLocation}
              </h3>
              <DeliveryMapPicker
                deliveryLat={order.deliveryLat}
                deliveryLng={order.deliveryLng}
                readonly
              />
            </section>
          )}
          <Separator />
          {/* Totals */}
          <section>
            <h3 className="text-lg font-semibold">{t.sections.totals}</h3>
            <div className="grid grid-cols-2 gap-4 mt-2 text-sm">
              <div>
                <p className="text-muted-foreground">{t.fields.subtotal}</p>
                <p>{formatCurrency(order.subtotal)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t.fields.tax}</p>
                <p>{formatCurrency(order.taxAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t.fields.shipping}</p>
                <p>{formatCurrency(order.shippingAmount)}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t.fields.discount}</p>
                <p>{formatCurrency(order.discountAmount)}</p>
              </div>
              <div className="col-span-2 flex justify-between font-semibold text-base mt-2">
                <span>{t.fields.total}</span>
                <span>{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </section>
        </div>
      </SheetContent>
    </Sheet>
  );
}
