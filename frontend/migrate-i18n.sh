#!/bin/bash

# Script to help migrate remaining i18n files

# List of files that still need migration
FILES=(
  "src/components/sku/edit-sku-dialog.tsx"
  "src/components/sku/enhanced-sku-table.tsx"
  "src/components/order-item/enhabced-order-items-table.tsx"
  "src/components/order/create-order-dialog.tsx"
  "src/components/order/edit-order-sheet.tsx"
  "src/components/order/enhanced-order-table.tsx"
  "src/components/order/order-details.tsx"
  "src/components/product-variant/create-product-variant-dialog.tsx"
  "src/app/dashboard/settings/page.tsx"
  "src/app/dashboard/skus/page.tsx"
  "src/app/dashboard/order-items/page.tsx"
  "src/app/dashboard/orders/page.tsx"
)

echo "Files still using old i18n pattern:"
for file in "${FILES[@]}"; do
  if [ -f "$file" ]; then
    echo "  - $file"
  fi
done

echo ""
echo "To manually complete migration, update each file:"
echo "1. Replace: import { useLocale } from '@/components/local-lang-swither';"
echo "   With: import { useTranslations } from 'next-intl';"
echo ""
echo "2. Remove: import { getMessages } from '@/lib/locale';"
echo ""
echo "3. Replace: const { locale } = useLocale();"
echo "            const t = getMessages(locale).pages.SECTION;"
echo "   With: const t = useTranslations('pages.SECTION');"
echo ""
echo "4. Replace all t.SECTION.key with t('key')"
