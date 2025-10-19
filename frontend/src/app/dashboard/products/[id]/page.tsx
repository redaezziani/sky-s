'use client'
import { useEffect, useState } from 'react';
import React from 'react';
import { ArrowLeft, Package, DollarSign, Warehouse, Star, Calendar, Image as ImageIcon, Ruler, Edit, Trash2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
// import { Alert, AlertDescription } from '@/components/ui/alert';
import { axiosInstance } from '@/lib/utils';
import { IconCircleCheckFilled } from '@tabler/icons-react';
import { SKUImageGallery } from '@/components/product/id/preview-iamges';

// Types
type Sku = {
  id: string;
  sku: string;
  price: number;
  stock: number;
  dimensions: {
    size: string;
    width: number;
    height: number;
    length: number;
  };
  coverImage: string;
  images: string[];
  createdAt: string;
  updatedAt: string;
};

type Variant = {
  id: string;
  name: string;
  attributes: { [key: string]: string };
  skus: Sku[];
};

type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
  shortDesc: string;
  coverImage: string;
  metaTitle: string;
  metaDesc: string;
  categories: { id: string; name: string; slug: string }[];
  variants: Variant[];
  startingPrice: number;
  inStock: boolean;
  totalStock: number;
  avgRating: number;
  createdAt: string;
  updatedAt: string;
};

export default function ProductDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const resolvedParams = React.use(params);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await axiosInstance.get(`/public/products/${resolvedParams.id}`);
        setProduct(res.data);
      } catch (err) {
        setError('Failed to load product details');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [resolvedParams.id]);

  if (loading) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-6">
        <Skeleton className="h-10 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="p-8 max-w-7xl mx-auto">
        {/* <Alert variant="destructive">
          <AlertDescription>{error || 'Product not found'}</AlertDescription>
        </Alert> */}
      </div>
    );
  }

  return (
    <div className=" space-y-8  px-4 ">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </div>
        <div className="flex  gap-2">
          <Button variant="outline" size="sm">
            <Edit className="h-4 w-4 mr-2" />
            Edit
          </Button>
          <Button variant="destructive" size="sm">
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Starting Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${product.startingPrice.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Stock</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.totalStock}</div>
            <Badge variant={product.inStock ? "secondary" : "destructive"} className="mt-2">
              {product.inStock ? (
                <IconCircleCheckFilled className="fill-green-500 dark:fill-green-400" />
              ) : (
                <IconCircleCheckFilled className="fill-red-500 dark:fill-red-400" />
              )}{" "}
              {product.inStock ? "In Stock" : "Out of Stock"}

            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.avgRating.toFixed(1)}</div>
            <div className="flex gap-1 mt-2">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < Math.floor(product.avgRating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-gray-300"
                    }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Variants</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{product.variants.length}</div>
            <p className="text-xs text-muted-foreground mt-2">
              {product.variants.reduce((acc, v) => acc + v.skus.length, 0)} SKUs total
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Product Info */}
          <Card>
            <CardHeader>
              <CardTitle>Product Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm font-medium text-muted-foreground">Description</label>
                <p className="mt-1">{product.description}</p>
              </div>
              <Separator />
              <div>
                <label className="text-sm font-medium text-muted-foreground">Short Description</label>
                <p className="mt-1">{product.shortDesc}</p>
              </div>
              <Separator />
              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground">Meta Title</label>
                  <p className="mt-1 text-sm">{product.metaTitle}</p>
                </div>
                <div className="flex-1">
                  <label className="text-sm font-medium text-muted-foreground">Meta Description</label>
                  <p className="mt-1 text-sm">{product.metaDesc}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Variants & SKUs */}
          <Card>
            <CardHeader>
              <CardTitle>Variants & SKUs</CardTitle>
              <CardDescription>Manage product variants and stock keeping units</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {product.variants.map((variant) => (
                <div key={variant.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold text-lg">{variant.name}</h3>
                      <div className="flex gap-2 mt-1">
                        {Object.entries(variant.attributes)
                          .slice(0, 2)
                          .map(([key, value]) => (
                            <Badge key={key} variant="secondary">
                              {key}: {value}
                            </Badge>
                          ))}
                        {Object.entries(variant.attributes).length > 2 && (
                          <Badge variant="secondary">
                            +{Object.entries(variant.attributes).length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Badge>{variant.skus.length} SKUs</Badge>
                  </div>

                  <div className="space-y-3">
                    {variant.skus.map((sku) => (
                      <div
                        key={sku.id}
                        className="flex items-center gap-4 p-4 border rounded-lg hover:bg-accent/50 transition-colors"
                      >
                        <img
                          src={sku.coverImage}
                          alt={sku.sku}
                          className="w-16 h-16 object-cover rounded"
                        />
                        <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-muted-foreground">SKU</p>
                            <p className="font-mono text-sm">{sku.sku}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="font-semibold">${sku.price.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Stock</p>
                            <p className="font-semibold">{sku.stock} units</p>
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">Size</p>
                            <p className="text-sm">{sku.dimensions.size}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <Separator />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Cover Image */}
          <Card>
            <CardHeader>
              <CardTitle>Cover Image</CardTitle>
            </CardHeader>
            <CardContent>
              <img
                src={product.coverImage}
                alt={product.name}
                className="w-full h-64 object-cover rounded-lg"
              />
            </CardContent>
          </Card>

          {/* Categories */}
          <Card>
            <CardHeader>
              <CardTitle>Categories</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {product.categories.map((category) => (
                  <Badge key={category.id} variant="secondary">
                    {category.name}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Metadata */}
          <Card>
            <CardHeader>
              <CardTitle>Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Created</p>
                  <p className="font-medium">
                    {new Date(product.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Updated</p>
                  <p className="font-medium">
                    {new Date(product.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <Separator />
              <div className="flex items-center gap-2 text-sm">
                <Package className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-muted-foreground">Product ID</p>
                  <p className="font-mono text-xs">{product.id}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <SKUImageGallery variants={product.variants} imagesPerPage={6}/>
        </div>
      </div>
    </div>
  );
}
