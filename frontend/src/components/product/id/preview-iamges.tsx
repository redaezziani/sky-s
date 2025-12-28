import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { getMessages } from '@/lib/locale';
import { useLocale } from '@/components/local-lang-swither';

type ImageGalleryProps = {
  variants: Array<{
    id: string;
    skus: Array<{
      id: string;
      sku: string;
      images: string[];
    }>;
  }>;
  imagesPerPage?: number;
};

export function SKUImageGallery({ variants, imagesPerPage = 6 }: ImageGalleryProps) {
  const { locale } = useLocale();
  const t = getMessages(locale).pages.products.productDetails.skuImageGallery;
  const [currentPage, setCurrentPage] = useState(1);

  const allImages = variants.flatMap((variant) =>
    variant.skus.flatMap((sku) =>
      sku.images.map((image, idx) => ({
        image,
        sku: sku.sku,
        key: `${sku.id}-${idx}`
      }))
    )
  );

  const totalPages = Math.ceil(allImages.length / imagesPerPage);
  const startIndex = (currentPage - 1) * imagesPerPage;
  const displayImages = allImages.slice(startIndex, startIndex + imagesPerPage);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t.title}</CardTitle>
        <CardDescription>{t.description.replace('{count}', String(allImages.length))}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2">
          {displayImages.map(({ image, sku, key }) => (
            <div
              key={key}
              className="relative aspect-square rounded-lg overflow-hidden border hover:border-primary transition-colors cursor-pointer group"
            >
              <img
                src={image}
                alt={sku}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                <p className="text-white text-xs font-mono">{sku}</p>
              </div>
            </div>
          ))}
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              {t.pagination.previous}
            </Button>
            <span className="text-sm text-muted-foreground px-2">
              {t.pagination.page
                .replace('{current}', String(currentPage))
                .replace('{total}', String(totalPages))}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              {t.pagination.next}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
