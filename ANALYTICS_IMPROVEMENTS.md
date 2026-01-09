# Analytics Module Improvements for POS System

## Current Implementation ✅
- Total Orders, Revenue, Active Users, Products Sold cards
- Daily chart data (orders, revenue, products)
- Top 10 products by quantity
- Category performance metrics

## Recommended Additions for POS System 🚀

### 1. **Payment Method Analytics** (Critical for POS)
```typescript
// Endpoint: GET /analytics/payment-methods
- Cash vs Card breakdown
- Payment method trends over time
- Average transaction value per payment method
```

### 2. **Hourly Sales Pattern** (Operations Planning)
```typescript
// Endpoint: GET /analytics/hourly-sales
- Sales by hour of day
- Peak hours identification
- Staff scheduling optimization
```

### 3. **Inventory Analytics** (Stock Management)
```typescript
// Endpoint: GET /analytics/inventory
- Low stock alerts count
- Out of stock products
- Inventory turnover rate
- Stock value
- Products nearing reorder point
```

### 4. **Profit & Margin Analytics**
⚠️ Currently missing costPrice field - need to add it back for profit calculation
```typescript
// Endpoint: GET /analytics/profit-margin
- Gross profit
- Profit margin percentage
- Most profitable products
- Profit trends
```

### 5. **Cashier/Employee Performance** (Staff Management)
```typescript
// Endpoint: GET /analytics/employee-performance
- Orders processed per employee
- Revenue per employee
- Average transaction time
- Top performing cashiers
```

### 6. **Customer Analytics** (If tracking customers)
```typescript
// Endpoint: GET /analytics/customers
- New vs returning customers
- Customer lifetime value
- Average order value per customer
- Top customers
```

### 7. **Returns & Refunds Analytics** (Quality Control)
```typescript
// Endpoint: GET /analytics/returns
- Return rate
- Refund amount
- Most returned products
- Return reasons (if tracked)
```

### 8. **Lot/Shipment Analytics** (Supply Chain)
```typescript
// Endpoint: GET /analytics/lots
- Lots received vs pending
- Arrival delays
- Damaged goods percentage
- Supplier performance
```

### 9. **Average Transaction Metrics** (Business Intelligence)
```typescript
// Endpoint: GET /analytics/transaction-metrics
- Average order value (AOV)
- Average items per order
- Transaction frequency
- Basket size trends
```

### 10. **Sales by Day of Week** (Trend Analysis)
```typescript
// Endpoint: GET /analytics/weekly-pattern
- Sales by day of week
- Best/worst performing days
- Weekend vs weekday comparison
```

### 11. **Best/Worst Performing SKUs** (Product Management)
```typescript
// Endpoint: GET /analytics/sku-performance
- Slow-moving SKUs
- Dead stock identification
- SKU profitability
- Variant performance comparison
```

### 12. **Real-time Dashboard Metrics** (Live Operations)
```typescript
// Endpoint: GET /analytics/real-time
- Today's sales (real-time)
- Current hour sales
- Active transactions
- Current cash in register
```

## Priority Implementation Order

### Phase 1 (Essential for POS):
1. Payment Method Analytics
2. Real-time Dashboard Metrics
3. Hourly Sales Pattern
4. Average Transaction Metrics

### Phase 2 (Operational):
5. Inventory Analytics
6. Employee Performance
7. Lot/Shipment Analytics
8. Sales by Day of Week

### Phase 3 (Advanced):
9. Profit & Margin Analytics (requires costPrice)
10. Customer Analytics
11. Returns & Refunds Analytics
12. SKU Performance Analytics

## Database Changes Needed

### 1. Add Order Processing Timestamp
```prisma
model Order {
  // ... existing fields
  processedAt DateTime? // When order was completed
  processedById String? // Which employee processed it
  processedBy User? @relation("OrderProcessor", fields: [processedById], references: [id])
}
```

### 2. Consider Re-adding Cost Price for Profit Calculation
```prisma
model ProductSKU {
  // ... existing fields
  costPrice Decimal? @db.Decimal(10, 2) // For profit margin calculation
}
```

### 3. Add Return/Refund Tracking
```prisma
model OrderReturn {
  id String @id @default(uuid())
  orderId String
  reason String?
  amount Decimal @db.Decimal(10, 2)
  status ReturnStatus
  createdAt DateTime @default(now())

  order Order @relation(fields: [orderId], references: [id])
}

enum ReturnStatus {
  PENDING
  APPROVED
  REJECTED
  COMPLETED
}
```

## Performance Considerations

1. **Add Database Indexes** for analytics queries:
```prisma
@@index([createdAt, status]) // On Order table
@@index([createdAt, paymentStatus]) // On Order table
@@index([createdAt]) // On OrderItem table
```

2. **Implement Caching** for expensive queries:
- Cache analytics cards for 5-15 minutes
- Use Redis for real-time metrics
- Pre-aggregate daily/weekly stats

3. **Add Date Range Filters** to all endpoints:
```typescript
startDate?: Date
endDate?: Date
```

## Example Implementation

### 1. Payment Method Analytics
```typescript
async getPaymentMethodBreakdown(period: number) {
  const startDate = subDays(new Date(), period);

  const payments = await this.prisma.payment.groupBy({
    by: ['method'],
    _sum: { amount: true },
    _count: { method: true },
    where: {
      createdAt: { gte: startDate },
      status: 'COMPLETED'
    }
  });

  return payments.map(p => ({
    method: p.method,
    totalAmount: Number(p._sum.amount || 0),
    transactionCount: p._count.method,
    percentage: // calculate percentage
  }));
}
```

### 2. Hourly Sales Pattern
```typescript
async getHourlySales(period: number) {
  const startDate = subDays(new Date(), period);

  const orders = await this.prisma.order.findMany({
    where: {
      createdAt: { gte: startDate },
      status: { not: 'CANCELLED' }
    },
    select: { createdAt: true, totalAmount: true }
  });

  const hourlyData = Array(24).fill(0).map((_, hour) => ({
    hour,
    orders: 0,
    revenue: 0
  }));

  orders.forEach(order => {
    const hour = order.createdAt.getHours();
    hourlyData[hour].orders += 1;
    hourlyData[hour].revenue += Number(order.totalAmount);
  });

  return hourlyData;
}
```

## Conclusion

Your current analytics module is a good foundation but lacks POS-specific features. Focus on implementing Phase 1 features first as they provide the most immediate value for daily store operations.
