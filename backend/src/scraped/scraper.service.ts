// scraper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageKitService } from '../common/services/imagekit.service';
import axios from 'axios';
import * as cheerio from 'cheerio';
import * as fs from 'fs';
import * as path from 'path';

interface ScrapedProduct {
  title: string;
  url: string;
  price: string;
  originalPrice?: string;
  badge?: string;
  mainImage: string;
  images: string[];
  description: string;
  category: string;
  notes?: {
    top?: string;
    heart?: string;
    base?: string;
  };
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly baseUrl = 'https://parfum.homes';
  private readonly imagesDir = path.join(
    process.cwd(),
    'temp',
    'scraped-products',
  );
  private scrapingStatus = {
    isRunning: false,
    currentPage: 0,
    totalProducts: 0,
    processedProducts: 0,
    errors: [] as string[],
  };

  // Hardcoded category ID
  private readonly perfumeCategoryId = '067817aa-2d92-4529-abd2-2407c422a400';

  constructor(
    private readonly prisma: PrismaService,
    private readonly imageKit: ImageKitService,
  ) {
    this.ensureDirectoryExists(this.imagesDir);
  }

  private ensureDirectoryExists(dir: string) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      this.logger.log(`Created directory: ${dir}`);
    }
  }

  async scrapeAllParfums() {
    if (this.scrapingStatus.isRunning) {
      throw new Error('Scraping is already in progress');
    }

    this.scrapingStatus = {
      isRunning: true,
      currentPage: 0,
      totalProducts: 0,
      processedProducts: 0,
      errors: [],
    };

    try {
      const allProducts: ScrapedProduct[] = [];

      // Scrape pages 1-7
      for (let page = 1; page <= 7; page++) {
        this.scrapingStatus.currentPage = page;
        this.logger.log(`Scraping page ${page}...`);

        try {
          const products = await this.scrapePage(page);
          allProducts.push(...products);
          this.logger.log(`Found ${products.length} products on page ${page}`);
        } catch (error) {
          this.logger.error(`Error scraping page ${page}:`, error.message);
          this.scrapingStatus.errors.push(`Page ${page}: ${error.message}`);
        }
      }

      this.scrapingStatus.totalProducts = allProducts.length;
      this.logger.log(
        `Found total ${allProducts.length} products. Starting detailed scraping...`,
      );

      // Process each product
      for (const product of allProducts) {
        try {
          await this.processProduct(product, this.perfumeCategoryId);
          this.scrapingStatus.processedProducts++;
          this.logger.log(
            `Processed ${this.scrapingStatus.processedProducts}/${this.scrapingStatus.totalProducts} products`,
          );
        } catch (error) {
          this.logger.error(
            `Error processing product ${product.title}:`,
            error.message,
          );
          this.scrapingStatus.errors.push(
            `Product ${product.title}: ${error.message}`,
          );
        }
      }

      return {
        totalScraped: allProducts.length,
        totalProcessed: this.scrapingStatus.processedProducts,
        errors: this.scrapingStatus.errors,
      };
    } finally {
      this.scrapingStatus.isRunning = false;
    }
  }

  private async scrapePage(page: number): Promise<ScrapedProduct[]> {
    const url = `${this.baseUrl}/collections/parfum-homme?page=${page}`;
    const response = await axios.get(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);
    const products: ScrapedProduct[] = [];

    $('.product-grid-container .grid__item').each((index, element) => {
      try {
        const $item = $(element);

        const title = $item.find('.card__heading a').text().trim();
        const productUrl = $item.find('.card__heading a').attr('href');
        const mainImage = this.normalizeImageUrl(
          $item.find('.card__media img').first().attr('src') || '',
        );

        const salePrice = $item.find('.price-item--sale').text().trim();
        const regularPrice = $item.find('.price-item--regular s').text().trim();
        const currentPrice =
          salePrice || $item.find('.price-item--regular').text().trim();

        const badge = $item.find('.badge').text().trim();

        if (title && productUrl && mainImage) {
          products.push({
            title,
            url: this.baseUrl + productUrl,
            price: currentPrice,
            originalPrice: regularPrice || undefined,
            badge: badge || undefined,
            mainImage,
            images: [mainImage],
            description: '',
            category: 'parfum-homme',
          });
        }
      } catch (error) {
        this.logger.warn(`Error parsing product item:`, error.message);
      }
    });

    return products;
  }

  private async processProduct(
    product: ScrapedProduct,
    categoryId: string,
  ): Promise<void> {
    const slug = this.generateSlug(product.title);
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug },
    });

    if (existingProduct) {
      this.logger.debug(`Product already exists: ${product.title}`);
      return;
    }

    const detailedProduct = await this.scrapeProductDetails(product.url);
    const finalProduct = { ...product, ...detailedProduct };
    const uploadedImageUrls = await this.downloadAndUploadImages(finalProduct);

    if (uploadedImageUrls.length === 0) {
      this.logger.warn(`No images uploaded for product: ${product.title}`);
      return;
    }

    await this.saveProductToDatabase(
      finalProduct,
      uploadedImageUrls,
      categoryId,
    );
  }

  private async scrapeProductDetails(
    productUrl: string,
  ): Promise<Partial<ScrapedProduct>> {
    const response = await axios.get(productUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    const $ = cheerio.load(response.data);

    const images: string[] = [];
    $('.product__media-list .product__media-item img').each(
      (index, element) => {
        const imgSrc = $(element).attr('src');
        if (imgSrc) images.push(this.normalizeImageUrl(imgSrc));
      },
    );

    const description = $('.product__description .rte').html() || '';
    const notes = this.extractNotes(description);

    return {
      images: images.length > 0 ? images : undefined,
      description: this.cleanDescription(description),
      notes,
    };
  }

  private normalizeImageUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return this.baseUrl + url;
    return url;
  }

  private extractNotes(description: string): {
    top?: string;
    heart?: string;
    base?: string;
  } {
    const notes: any = {};
    const $ = cheerio.load(description);

    $('li').each((index, element) => {
      const text = $(element).text();
      if (text.includes('Notes de tête'))
        notes['top'] = text.replace('Notes de tête :', '').trim();
      else if (text.includes('Notes de cœur'))
        notes['heart'] = text.replace('Notes de cœur :', '').trim();
      else if (text.includes('Notes de fond'))
        notes['base'] = text.replace('Notes de fond :', '').trim();
    });

    return notes;
  }

  private cleanDescription(description: string): string {
    const $ = cheerio.load(description);
    return $.text().replace(/\s+/g, ' ').trim();
  }

  private async downloadAndUploadImages(
    product: ScrapedProduct,
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];
    const productDir = path.join(
      this.imagesDir,
      this.sanitizeFileName(product.title),
    );
    this.ensureDirectoryExists(productDir);

    for (let i = 0; i < product.images.length; i++) {
      try {
        const imageUrl = product.images[i];
        const imageExtension = this.getImageExtension(imageUrl);
        const fileName = `image_${i + 1}${imageExtension}`;
        const filePath = path.join(productDir, fileName);

        const response = await axios.get(imageUrl, {
          responseType: 'stream',
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        await new Promise<void>((resolve, reject) => {
          writer.on('finish', () => resolve());
          writer.on('error', reject);
        });

        const buffer = fs.readFileSync(filePath);
        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: fileName,
          encoding: '7bit',
          mimetype: this.getMimeType(imageExtension),
          size: buffer.length,
          buffer,
          destination: '',
          filename: fileName,
          path: filePath,
          stream: undefined as any,
        };

        const result = await this.imageKit.uploadImage(file, {
          fileName,
          folder: `products/parfums/${this.sanitizeFileName(product.title)}`,
        });

        uploadedUrls.push(result.url);
        fs.unlinkSync(filePath);
        this.logger.debug(`Uploaded image: ${fileName}`);
      } catch (error) {
        this.logger.warn(
          `Failed to process image ${i + 1} for ${product.title}:`,
          error.message,
        );
      }
    }

    try {
      fs.rmdirSync(productDir);
    } catch {}
    return uploadedUrls;
  }

  private sanitizeFileName(name: string): string {
    return name.replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 100);
  }

  private getImageExtension(url: string): string {
    const match = url.match(/\.(jpg|jpeg|png|gif|webp)(\?|$)/i);
    return match ? '.' + match[1].toLowerCase() : '.jpg';
  }

  private getMimeType(extension: string): string {
    const mimeTypes: Record<string, string> = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.webp': 'image/webp',
    };
    return mimeTypes[extension] || 'image/jpeg';
  }

  private generateSlug(title: string): string {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private async saveProductToDatabase(
    product: ScrapedProduct,
    imageUrls: string[],
    categoryId: string,
  ): Promise<void> {
    const slug = this.generateSlug(product.title);
    const price = this.parsePrice(product.price);
    const originalPrice = product.originalPrice
      ? this.parsePrice(product.originalPrice)
      : null;

    const sizeMatch = product.title.match(/(\d+ml)/i);
    const size = sizeMatch ? sizeMatch[1] : '100ml';

    await this.prisma.product.create({
      data: {
        name: product.title,
        slug,
        description:
          product.description || `${product.title} - Premium parfum.`,
        shortDesc: this.generateShortDescription(product),
        coverImage: imageUrls[0],
        isFeatured: Math.random() > 0.7,
        metaTitle: `${product.title} - Premium Parfum`,
        metaDesc: `Shop ${product.title}. Premium quality parfum with ${product.notes?.top ? 'top notes of ' + product.notes.top : 'exquisite fragrance notes'}.`,
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: categoryId }, // ✅ string UUID
        },
        variants: {
          create: [
            {
              name: size,
              attributes: { size },
              isActive: true,
              sortOrder: 0,
              skus: {
                create: [
                  {
                    sku: this.generateSku(product.title, size),
                    price,
                    stock: Math.floor(Math.random() * 20) + 5,
                    weight: this.estimateWeight(size),
                    dimensions: this.estimateDimensions(size),
                    coverImage: imageUrls[0],
                    lowStockAlert: 2,
                    isActive: true,
                    images: {
                      create: imageUrls.map((url, idx) => ({
                        url,
                        altText: `${product.title} ${size} view ${idx + 1}`,
                        position: idx,
                      })),
                      // nice 
                    },
                  },
                ],
              },
            },
          ],
        },
      },
    });

    this.logger.debug(`Saved product to database: ${product.title}`);
  }

  private generateShortDescription(product: ScrapedProduct): string {
    if (product.notes?.top) {
      return `Premium parfum with notes of ${product.notes.top}${product.notes.heart ? ', ' + product.notes.heart : ''}`;
    }
    return `Premium quality parfum - ${product.title}`;
  }

  private parsePrice(priceStr: string): number {
    const match = priceStr.match(/[\d,]+\.?\d*/);
    return match ? parseFloat(match[0].replace(',', '')) : 299;
  }

  private generateSku(title: string, size: string): string {
    const prefix = title
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 8);
    const sizeCode = size.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `${prefix}-${sizeCode}-${Date.now()}`;
  }

  private estimateWeight(size: string): number {
    const sizeNum = parseInt(size.replace(/[^0-9]/g, ''));
    if (sizeNum >= 100) return 600;
    if (sizeNum >= 50) return 400;
    return 300;
  }

  private estimateDimensions(size: string) {
    const sizeNum = parseInt(size.replace(/[^0-9]/g, ''));
    if (sizeNum >= 100) return { length: 15, width: 8, height: 20, size };
    if (sizeNum >= 50) return { length: 12, width: 6, height: 18, size };
    return { length: 10, width: 5, height: 15, size };
  }

  getScrapingStatus() {
    return this.scrapingStatus;
  }
}
