# Complete i18n Migration Guide

This document provides the complete migration instructions for all remaining components.

## Summary

**Completed (9/17 components):**
- ✅ app-sidebar.tsx
- ✅ radar-chat.tsx
- ✅ chart-top-products.tsx
- ✅ category-performance.tsx
- ✅ chart-area-interactive.tsx
- ✅ section-cards.tsx
- ✅ multy-image-file.tsx
- ✅ pagination-table.tsx
- ✅ sku/create-sku-dialog.tsx

**Remaining (8/17 components):**
- ⏳ sku/edit-sku-dialog.tsx
- ⏳ sku/enhanced-sku-table.tsx
- ⏳ order/create-order-dialog.tsx
- ⏳ order/edit-order-sheet.tsx
- ⏳ order/enhanced-order-table.tsx
- ⏳ order/order-details.tsx
- ⏳ order-item/enhabced-order-items-table.tsx
- ⏳ product-variant/create-product-variant-dialog.tsx

## Migration Pattern

For ALL remaining files, apply these changes:

### 1. Replace Imports

**FIND:**
```tsx
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";
```

**REPLACE WITH:**
```tsx
import { useTranslations } from "next-intl";
```

### 2. Update Translation Initialization

**For each file, replace the locale hook pattern with the appropriate namespace:**

| File | Old Pattern | New Pattern |
|------|-------------|-------------|
| `sku/edit-sku-dialog.tsx` | `const { locale } = useLocale();`<br>`const t = getMessages(locale).pages.skus.dialogs;` | `const t = useTranslations('pages.skus.dialogs.editSKU');` |
| `sku/enhanced-sku-table.tsx` | `const { locale } = useLocale();`<br>`const t = getMessages(locale).pages.skus.components.skuTable;` | `const t = useTranslations('pages.skus.components.skuTable');` |
| `order/create-order-dialog.tsx` | `const { locale } = useLocale();`<br>`const t = getMessages(locale).pages.orders.dialogs.createOrder \|\| {};` | `const t = useTranslations('pages.orders.dialogs.createOrder');` |
| `order/edit-order-sheet.tsx` | `const { locale } = useLocale();`<br>`const t = getMessages(locale).pages.orders.dialogs.updateOrder \|\| {};` | `const t = useTranslations('pages.orders.dialogs.updateOrder');` |
| `order/enhanced-order-table.tsx` | `const { locale } = useLocale();`<br>`const t = getMessages(locale).pages.orders;` | `const t = useTranslations('pages.orders');` |
| `order/order-details.tsx` | `const { locale } = useLocale();`<br>`const t = getMessages(locale).pages.orders.dialogs.orderDetails;` | `const t = useTranslations('pages.orders.dialogs.orderDetails');` |
| `order-item/enhabced-order-items-table.tsx` | `const { locale } = useLocale();`<br>`const t = getMessages(locale).pages.orderItems.components.orderItemsTable;` | `const t = useTranslations('pages.orderItems.components.orderItemsTable');` |
| `product-variant/create-product-variant-dialog.tsx` | `const { locale } = useLocale();`<br>`const t = getMessages(locale).pages.variants.components.dialogs.createProductVariant;` | `const t = useTranslations('pages.variants.components.dialogs.createProductVariant');` |

### 3. Update All Translation References

Replace dot notation with function calls:

**OLD:**
```tsx
t.title
t.fields.sku
t.toast?.success || "Default"
t.periods[timeRange]
t.errors.maxSize.replace("{0}", count)
```

**NEW:**
```tsx
t('title')
t('fields.sku')
t('toast.success')
t(`periods.${timeRange}`)
t('errors.maxSize', { count })
```

### 4. Remove Locale-Specific Code

**Remove:**
- Remove `|| "Default fallback"` patterns (next-intl handles missing keys)
- Remove optional chaining on translations (`t.field?.value` → `t('field.value')`)
- Keep locale variable ONLY for `Intl.NumberFormat` or `Intl.DateTimeFormat` if needed

### 5. Handle Dynamic Locale Usage

**For `Intl` APIs, use `useLocale()` from next-intl:**

```tsx
import { useLocale, useTranslations } from "next-intl";

const locale = useLocale();
const t = useTranslations('namespace');

// Use locale for formatting only
const formatted = new Intl.NumberFormat(locale, {
  style: "currency",
  currency: "USD"
}).format(amount);
```

## Complete Migration Examples

### Example: sku/edit-sku-dialog.tsx

**Before:**
```tsx
import { useLocale } from "@/components/local-lang-swither";
import { getMessages } from "@/lib/locale";

const { locale } = useLocale();
const t = getMessages(locale).pages.skus.dialogs;

// Usage
<DialogTitle>{t.editSKU.title}</DialogTitle>
toast.success(t.toast?.skuUpdated || "SKU updated");
```

**After:**
```tsx
import { useTranslations } from "next-intl";

const t = useTranslations('pages.skus.dialogs.editSKU');

// Usage
<DialogTitle>{t('title')}</DialogTitle>
toast.success(t('toast.skuUpdated'));
```

### Example: order/enhanced-order-table.tsx

**Before:**
```tsx
const { locale } = useLocale();
const t = getMessages(locale).pages.orders;

const formatCurrency = (amount, currency) =>
  new Intl.NumberFormat(locale === "ja" ? "ja-JP" : "en-US", {
    style: "currency",
    currency,
  }).format(amount);

{t.components?.ordersTable?.table?.orderNumber ?? "Order"}
```

**After:**
```tsx
import { useLocale, useTranslations } from "next-intl";

const locale = useLocale();
const t = useTranslations('pages.orders');

const formatCurrency = (amount, currency) =>
  new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
  }).format(amount);

{t('components.ordersTable.table.orderNumber')}
```

## Quick Reference: Translation Key Changes

| Old Pattern | New Pattern |
|-------------|-------------|
| `t.editSKU.title` | `t('title')` |
| `t.fields[name]` | `t(\`fields.${name}\`)` |
| `t.toast?.success` | `t('toast.success')` |
| `t.components?.skuTable?.title` | `t('components.skuTable.title')` |
| `t.periods["90d"]` | `t('periods.90d')` |

## Testing After Migration

After completing all migrations:

1. Remove old i18n utilities:
   ```bash
   rm src/components/local-lang-swither.tsx
   rm src/lib/locale.ts
   rm -rf src/messages  # Old location
   ```

2. Verify translations load correctly:
   ```bash
   npm run dev
   ```

3. Test language switching
4. Verify all components render correctly
5. Check browser console for missing translation warnings

## Notes

- All translation files are in `/home/vanhelsing/Desktop/my-work/sky-s/frontend/messages/`
- The next-intl configuration is in `next.config.ts` and `src/i18n.ts`
- Default locale: English (en)
- Supported locales: en, fr, ja
