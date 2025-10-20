import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageKitService } from '../common/services/imagekit.service';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Page } from 'puppeteer';

interface MasonGarmentsItem {
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  discount: string;
  currency: string;
  rating: number;
  sizes: string;
  colors: string;
  quantity: number;
  cover_img: string;
  prev_imgs: string;
  category_id: number;
  slug: string;
  shipping: string;
  material: string;
  articleNumber: string;
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly baseUrl =
    'https://www.masongarments.com/products/genova-multicolore-black';
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
  private readonly productCategoryId = 'eb6c7678-d78a-4d40-a48b-8b675f23afcd';

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

  private delay = (ms: number) =>
    new Promise((resolve) => setTimeout(resolve, ms));

  async scrapeOnlyProductDetail(
    productUrl: string,
  ): Promise<MasonGarmentsItem> {
    if (this.scrapingStatus.isRunning) {
      throw new Error('Scraping is already in progress');
    }

    this.scrapingStatus = {
      isRunning: true,
      currentPage: 0,
      totalProducts: 1,
      processedProducts: 0,
      errors: [],
    };

    let browser;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--single-process'],
      });
      const page = await browser.newPage();

      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );
      await page.setViewport({ width: 1920, height: 1080 });

      this.logger.log(`Scraping product: ${productUrl}`);

      await page.goto(productUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000,
      });

      await page
        .evaluate(() => {
          const acceptButton =
            document.querySelector('#onetrust-accept-btn-handler') ||
            document.querySelector('.cookie-consent-button') ||
            document.querySelector('[data-cy="cookie-banner-accept"]');
          if (acceptButton) {
            (acceptButton as HTMLElement).click();
          }
        })
        .catch((e) =>
          this.logger.debug('No visible cookie banner found or click failed.'),
        );

      await page.waitForSelector('.product-title', { timeout: 10000 });

      const baseProduct = await this.scrapeStaticProductDetails(page);

      const allImages: Set<string> = new Set();
      const allSizes: Set<string> = new Set();
      const allColors: Set<string> = new Set();

      // First, scrape initial images before any interaction
      this.logger.log('Scraping initial product images...');
      const initialImages = await this.scrapeProductImages(page);
      initialImages.forEach((img) => allImages.add(img));
      this.logger.log(`Found ${initialImages.length} initial images`);

      const sizeOptionElements = await page.$$(
        '.variant-picker__option-values .block-swatch:not(.is-disabled)',
      );

      if (sizeOptionElements.length === 0) {
        this.logger.warn(
          'No active size variants found. Using initial view data.',
        );
        const initialVariantData = await this.scrapeCurrentVariantData(page);
        initialVariantData.sizes.forEach((size) => allSizes.add(size));
        allColors.add(initialVariantData.color);
      } else {
        this.logger.log(
          `Found ${sizeOptionElements.length} active size variants to iterate through.`,
        );

        for (let i = 0; i < sizeOptionElements.length; i++) {
          const currentSizeEl = (
            await page.$$(
              '.variant-picker__option-values .block-swatch:not(.is-disabled)',
            )
          )[i];
          if (!currentSizeEl) continue;

          const sizeText = await page.evaluate(
            (el) => el.textContent?.trim(),
            currentSizeEl,
          );
          if (sizeText) allSizes.add(sizeText);

          await currentSizeEl
            .click()
            .catch((e) =>
              this.logger.warn(
                `Failed to click size swatch ${sizeText}: ${e.message}`,
              ),
            );
          await this.delay(1500);

          const variantData = await this.scrapeCurrentVariantData(page);
          variantData.images.forEach((img) => allImages.add(img));
          allColors.add(variantData.color);

          this.logger.debug(
            `Scraped size variant ${sizeText}. Current Color: ${variantData.color}. Images collected so far: ${allImages.size}`,
          );
        }
      }

      const colorSwatchElements = await page.$$(
        '.variant-picker__option-values.wrap a.media-swatch',
      );
      if (colorSwatchElements.length > 0) {
        for (const colorEl of colorSwatchElements) {
          const imgElement = await colorEl.$('img');
          if (imgElement) {
            const altText = await page.evaluate(
              (el) => el.getAttribute('alt'),
              imgElement,
            );
            if (altText) {
              const colorMatch = altText.match(/Genova\s+(.*?)\s*-\s*Mason/i);
              if (colorMatch && colorMatch[1]) {
                allColors.add(colorMatch[1].trim());
              }
            }
          }
        }
      }

      const finalProduct: MasonGarmentsItem = {
        ...baseProduct,
        sizes: Array.from(allSizes).join('@'),
        colors: Array.from(allColors).join('@'),
        cover_img: Array.from(allImages)[0] || baseProduct.cover_img,
        prev_imgs: Array.from(allImages).join('@'),
      };

      this.logger.log(
        `Successfully scraped product: ${finalProduct.name}. Total Images: ${allImages.size}, Total Sizes: ${allSizes.size}, Total Colors: ${allColors.size}`,
      );

      if (allImages.size === 0) {
        this.logger.error('NO IMAGES WERE SCRAPED! Check selectors.');
        throw new Error('Image scraping failed - no images found');
      }

      await this.processAndSaveProduct(finalProduct, this.productCategoryId);
      this.scrapingStatus.processedProducts = 1;

      return finalProduct;
    } catch (error) {
      this.logger.error('Error during product scraping:', error.message);
      this.scrapingStatus.errors.push(error.message);
      throw error;
    } finally {
      if (browser) await browser.close();
      this.scrapingStatus.isRunning = false;
    }
  }

  async scrapeOnlyClothing(
    maxPages: number = 1,
    productsThreshold: number = 3,
  ) {
    this.logger.warn(
      'scrapeOnlyClothing is deprecated. Use scrapeOnlyProductDetail for individual products.',
    );
    throw new Error(
      'This method is deprecated. Use scrapeOnlyProductDetail(url) to scrape individual product pages.',
    );
  }

  private async scrapeStaticProductDetails(
    page: Page,
  ): Promise<MasonGarmentsItem> {
    return await page.evaluate((): MasonGarmentsItem => {
      const cleanImageUrl = (url: string): string => {
        if (!url) return '';
        const clean = url.split('?')[0];
        return clean.startsWith('//') ? `https:${clean}` : clean;
      };

      const titleElement = document.querySelector('.product-title');
      const name =
        titleElement?.textContent?.replace('&nbsp;', '').trim() ||
        'Mason Garments Product';

      const priceElement = document.querySelector('.price-list sale-price');
      const priceText =
        priceElement?.textContent?.trim().replace('Sale price', '') || '0 EUR';
      const priceMatch = priceText.match(/(\d+(?:[.,]\d+)?)/);
      const price = priceMatch
        ? parseFloat(priceMatch[1].replace(',', '.'))
        : 0;

      const currency = priceText.includes('EUR') ? 'EUR' : '€';

      const originalPriceElement = document.querySelector(
        '.price-list compare-at-price:not([hidden])',
      );
      const originalPriceText =
        originalPriceElement?.textContent
          ?.trim()
          .replace('Regular price', '') || '';
      const originalPriceMatch = originalPriceText.match(/(\d+(?:[.,]\d+)?)/);
      const originalPrice = originalPriceMatch
        ? parseFloat(originalPriceMatch[1].replace(',', '.'))
        : null;

      const discount = '';

      let description = '';
      const descriptionElement = document.querySelector(
        '#description_area .prose',
      );
      if (descriptionElement) {
        description =
          descriptionElement.textContent?.replace(/\n\s*\n/g, '\n').trim() ||
          '';
      }

      let material = '';
      const materialListItems = document.querySelectorAll(
        '#product_details .accordion__content li',
      );
      if (materialListItems.length > 0) {
        const materialItem = Array.from(materialListItems).find(
          (li) =>
            li.textContent?.toLowerCase().includes('suede') ||
            li.textContent?.toLowerCase().includes('nubuck') ||
            li.textContent?.toLowerCase().includes('leather'),
        );
        if (materialItem) {
          material =
            materialItem.textContent?.trim() ||
            'Suede, nubuck and leather upper from Italian tanneries';
        }
      }
      if (!material) {
        material = 'Suede, nubuck and leather upper from Italian tanneries';
      }

      let articleNumber = '';
      const slug = name
        .toLowerCase()
        .replace(/ /g, '-')
        .replace(/[^\w-]+/g, '');
      const urlMatch = window.location.href.match(/\/products\/([^\/]+)/);
      if (urlMatch && urlMatch[1]) {
        articleNumber = urlMatch[1]
          .toUpperCase()
          .replace(/-/g, '')
          .substring(0, 10);
      } else {
        articleNumber = `${Math.floor(Math.random() * 90000000) + 10000000}`;
      }

      const initialCoverImageElement = document.querySelector(
        '.product-gallery__media.is-initial img',
      );
      const initialCoverImg = cleanImageUrl(
        initialCoverImageElement?.getAttribute('src') ||
          initialCoverImageElement?.getAttribute('data-src') ||
          '',
      );

      const rating = 5;
      const quantity = Math.floor(Math.random() * 20) + 10;

      const shippingDetailsElement = document.querySelector(
        '#shipping_and_payment .accordion__content',
      );
      let shipping = 'See shipping details.';
      if (shippingDetailsElement) {
        const firstParagraph = shippingDetailsElement.querySelector('p');
        const table = shippingDetailsElement.querySelector('table');
        const text =
          (firstParagraph?.textContent?.trim() || '') +
          ' ' +
          (table?.textContent?.trim() || '');
        shipping = text.replace(/\s+/g, ' ').trim().substring(0, 300);
      }
      if (!shipping || shipping.length < 50) {
        shipping =
          'Mason Garments provides worldwide shipping through local carriers. All shipping services provide a tracking number. See shipping table for details.';
      }

      return {
        name,
        description,
        price,
        original_price: originalPrice,
        discount,
        currency,
        rating,
        sizes: '',
        colors: '',
        quantity,
        cover_img: initialCoverImg,
        prev_imgs: '',
        category_id: 4,
        slug,
        shipping,
        material,
        articleNumber,
      };
    });
  }

  // NEW METHOD: Dedicated image scraping function with multiple fallback selectors
  private async scrapeProductImages(page: Page): Promise<string[]> {
    return await page.evaluate(() => {
      const cleanImageUrl = (url: string): string => {
        if (!url) return '';
        const clean = url.split('?')[0];
        return clean.startsWith('//') ? `https:${clean}` : clean;
      };

      const images: Set<string> = new Set();

      // Strategy 1: Product gallery media images (primary source)
      const galleryImages = document.querySelectorAll(
        '.product-gallery__media img',
      );
      galleryImages.forEach((img) => {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (
          src &&
          src.includes('masongarments.com') &&
          !src.includes('width=48') &&
          !src.includes('width=68')
        ) {
          images.add(cleanImageUrl(src));
        }
      });

      // Strategy 2: Scroll carousel images
      const carouselImages = document.querySelectorAll(
        '#product-gallery-carousel-14970851295617-template--25265761386881__main img',
      );
      carouselImages.forEach((img) => {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (
          src &&
          src.includes('masongarments.com') &&
          !src.includes('width=48') &&
          !src.includes('width=68')
        ) {
          images.add(cleanImageUrl(src));
        }
      });

      // Strategy 3: All product images with specific attributes
      const allProductImages = document.querySelectorAll(
        'img[alt*="Genova"][alt*="Mason Garments"]',
      );
      allProductImages.forEach((img) => {
        const src = img.getAttribute('src');
        const srcset = img.getAttribute('srcset');

        if (
          src &&
          src.includes('masongarments.com') &&
          !src.includes('width=48') &&
          !src.includes('width=68')
        ) {
          images.add(cleanImageUrl(src));
        }

        // Extract highest quality from srcset
        if (srcset) {
          const srcsetUrls = srcset
            .split(',')
            .map((s) => s.trim().split(' ')[0]);
          const highQualityUrl = srcsetUrls.find(
            (url) => url.includes('width=2048') || url.includes('width=2000'),
          );
          if (highQualityUrl) {
            images.add(cleanImageUrl(highQualityUrl));
          }
        }
      });

      // Strategy 4: Check for any image in the main product area
      const productInfoImages = document.querySelectorAll(
        '.product-info img, product-gallery img',
      );
      productInfoImages.forEach((img) => {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (
          src &&
          src.includes('masongarments.com') &&
          !src.includes('width=48') &&
          !src.includes('width=68')
        ) {
          images.add(cleanImageUrl(src));
        }
      });

      return Array.from(images);
    });
  }

  private async scrapeCurrentVariantData(
    page: Page,
  ): Promise<{ images: string[]; sizes: string[]; color: string }> {
    return await page.evaluate(() => {
      const cleanImageUrl = (url: string): string => {
        if (!url) return '';
        const clean = url.split('?')[0];
        return clean.startsWith('//') ? `https:${clean}` : clean;
      };

      let currentColor = 'Unknown';

      const colorLabel = Array.from(
        document.querySelectorAll(
          '.variant-picker__option .h-stack > p.text-subdued',
        ),
      ).find((p) => p.textContent?.trim() === 'Color:');

      if (colorLabel && colorLabel.nextElementSibling) {
        const colorTextElement = colorLabel.nextElementSibling;
        if (colorTextElement.textContent?.trim()) {
          currentColor = colorTextElement.textContent.trim();
        }
      }

      if (currentColor === 'Unknown' || !currentColor) {
        const selectedColorSwatchImg = document.querySelector(
          '.variant-picker__option-values a.media-swatch.is-selected img',
        );
        const altText = selectedColorSwatchImg?.getAttribute('alt');
        if (altText) {
          const colorMatch = altText.match(/Genova\s+(.*?)\s*-\s*Mason/i);
          if (colorMatch && colorMatch[1]) {
            currentColor = colorMatch[1].trim();
          }
        }
      }

      if (currentColor === 'Unknown' || !currentColor) {
        const titleElement = document.querySelector('.product-title');
        const name =
          titleElement?.textContent?.replace('&nbsp;', '').trim() || '';
        const nameColorMatch = name.match(/Genova\s+(.*)\s*/i);
        if (nameColorMatch && nameColorMatch[1]) {
          currentColor = nameColorMatch[1].trim();
        }
      }

      const sizeElements = document.querySelectorAll(
        '.variant-picker__option-values .block-swatch:not(.is-disabled) span',
      );
      const availableSizes: string[] = Array.from(sizeElements)
        .map((sizeEl) => sizeEl.textContent?.trim())
        .filter((size): size is string => !!size);

      // FIXED IMAGE SCRAPING - Multiple strategies
      const images: Set<string> = new Set();

      // Primary: Gallery media images
      const galleryImages = document.querySelectorAll(
        '.product-gallery__media img',
      );
      galleryImages.forEach((img) => {
        const src = img.getAttribute('src') || img.getAttribute('data-src');
        if (
          src &&
          src.includes('masongarments.com') &&
          !src.includes('width=48') &&
          !src.includes('width=68')
        ) {
          images.add(cleanImageUrl(src));
        }
      });

      // Secondary: Carousel images
      const carouselImages = document.querySelectorAll(
        'scroll-carousel img[alt*="Genova"]',
      );
      carouselImages.forEach((img) => {
        const src = img.getAttribute('src');
        if (
          src &&
          src.includes('masongarments.com') &&
          !src.includes('width=48')
        ) {
          images.add(cleanImageUrl(src));
        }
      });

      // Tertiary: Extract from srcset attributes for highest quality
      const allImages = document.querySelectorAll(
        'img[srcset*="masongarments"]',
      );
      allImages.forEach((img) => {
        const srcset = img.getAttribute('srcset');
        if (srcset) {
          const urls = srcset
            .split(',')
            .map((s) => s.trim().split(' ')[0])
            .filter((url) => url.includes('masongarments.com'));

          const highQualityUrl =
            urls.find(
              (url) => url.includes('width=2048') || url.includes('width=2000'),
            ) || urls[urls.length - 1];
          if (highQualityUrl) {
            images.add(cleanImageUrl(highQualityUrl));
          }
        }
      });

      return {
        images: Array.from(images),
        sizes: Array.from(new Set(availableSizes)),
        color: currentColor,
      };
    });
  }

  private async processAndSaveProduct(
    product: MasonGarmentsItem,
    categoryId: string,
  ): Promise<void> {
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (existingProduct) {
      this.logger.debug(`Product already exists: ${product.name}`);
      return;
    }

    const imageUrls = product.prev_imgs.split('@').filter((url) => url);

    const uploadedImageUrls = await this.downloadAndUploadImages(
      product.name,
      imageUrls,
    );

    if (uploadedImageUrls.length === 0) {
      this.logger.warn(`No images uploaded for product: ${product.name}`);
      return;
    }

    await this.saveProductToDatabase(product, uploadedImageUrls, categoryId);
  }

  private async downloadAndUploadImages(
    productName: string,
    imageUrls: string[],
  ): Promise<string[]> {
    const uploadedUrls: string[] = [];
    const productDir = path.join(
      this.imagesDir,
      this.sanitizeFileName(productName),
    );
    this.ensureDirectoryExists(productDir);

    for (let i = 0; i < imageUrls.length; i++) {
      try {
        const imageUrl = imageUrls[i];
        const imageExtension = this.getImageExtension(imageUrl);
        const fileName = `image_${i + 1}${imageExtension}`;
        const filePath = path.join(productDir, fileName);

        const cleanUrl = imageUrl.replace(/&width=\d+/i, '');

        const response = await fetch(cleanUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        const buffer = await response.arrayBuffer();
        fs.writeFileSync(filePath, Buffer.from(buffer));

        const file: Express.Multer.File = {
          fieldname: 'file',
          originalname: fileName,
          encoding: '7bit',
          mimetype: this.getMimeType(imageExtension),
          size: fs.statSync(filePath).size,
          buffer: fs.readFileSync(filePath),
          destination: '',
          filename: fileName,
          path: filePath,
          stream: undefined as any,
        };

        const result = await this.imageKit.uploadImage(file, {
          fileName,
          folder: `products/mason-garments/${this.sanitizeFileName(productName)}`,
        });

        uploadedUrls.push(result.url);
        fs.unlinkSync(filePath);
        this.logger.debug(`Uploaded image: ${fileName}`);
      } catch (error) {
        this.logger.warn(
          `Failed to process image ${i + 1} for ${productName}:`,
          error.message,
        );
      }
    }

    try {
      fs.rmdirSync(productDir);
    } catch {}
    return uploadedUrls;
  }

  private async saveProductToDatabase(
    product: MasonGarmentsItem,
    imageUrls: string[],
    categoryId: string,
  ): Promise<void> {
    const sizeArray = product.sizes.split('@').filter((s) => s);
    const colorArray = product.colors.split('@').filter((c) => c);

    if (sizeArray.length === 0) {
      this.logger.warn('No sizes scraped. Defaulting to size 42.');
      sizeArray.push('42');
    }
    if (colorArray.length === 0) {
      this.logger.warn('No colors scraped. Defaulting to Black.');
      colorArray.push('Black');
    }

    const shortDesc = `Handmade in Italy, the Mason Garments ${product.name} sneakers feature a premium ${product.material} upper and custom rubber outsole. Recommended to take one size up. Available in sizes ${sizeArray[0]}-${sizeArray[sizeArray.length - 1]}.`;

    console.log('=== PRODUCT DATA TO INSERT ===');
    console.log('Product:', JSON.stringify(product, null, 2));
    console.log('Image URLs:', imageUrls);
    console.log('Category ID:', categoryId);
    console.log('Size Array:', sizeArray);
    console.log('Color Array:', colorArray);
    console.log('Short Description:', shortDesc);

    const productData = {
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDesc: shortDesc,
      coverImage: imageUrls[0],
      isFeatured: product.rating >= 4.5,
      metaTitle: `${product.name} - Mason Garments Sneakers | ${product.currency}`,
      metaDesc: `${product.description.substring(0, 160)}...`,
      isActive: true,
      sortOrder: 0,
      categories: {
        connect: { id: categoryId },
      },
      variants: {
        create: sizeArray.flatMap((size, sizeIndex) =>
          colorArray.map((color, colorIndex) => ({
            name: `${size} - ${color}`,
            attributes: {
              size,
              color,
              material: product.material,
              articleNumber: product.articleNumber,
              brand: 'Mason Garments',
            },
            isActive: true,
            sortOrder: sizeIndex * colorArray.length + colorIndex,
            skus: {
              create: [
                {
                  sku: this.generateSku(product.name, `${size}-${color}`),
                  price: product.price,
                  comparePrice: product.original_price,
                  stock: product.quantity,
                  weight: this.getShoeWeight(size),
                  dimensions: this.getShoeDimensions(size),
                  coverImage: imageUrls[0],
                  lowStockAlert: 5,
                  isActive: true,
                  images: {
                    create: imageUrls.map((url, idx) => ({
                      url,
                      altText: `${product.name} ${size} ${color} view ${idx + 1}`,
                      position: idx,
                    })),
                  },
                },
              ],
            },
          })),
        ),
      },
    };

    console.log('=== PRISMA CREATE DATA ===');
    console.log(JSON.stringify(productData, null, 2));
    console.log('===============================');

    await this.prisma.product.create({
      data: productData,
    });

    this.logger.debug(`Saved product to database: ${product.name}`);
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

  private generateSku(title: string, variant: string): string {
    const prefix = title
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 8);
    const variantCode = variant.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `MG-${prefix}-${variantCode}-${Date.now()}`;
  }

  private getShoeWeight(size: string): number {
    const sizeNumber = parseInt(size, 10);
    const baseWeight = 850;
    if (sizeNumber < 40) return baseWeight - 50;
    if (sizeNumber > 45) return baseWeight + 150;
    return baseWeight + (sizeNumber - 40) * 25;
  }

  private getShoeDimensions(size: string): any {
    const sizeNumber = parseInt(size, 10);
    const baseLength = 30;
    const baseWidth = 20;
    const baseHeight = 12;

    const length = baseLength + Math.floor((sizeNumber - 40) * 0.5);
    const width = baseWidth;
    const height = baseHeight;

    return { length, width, height, size };
  }

  private getClothingWeight = this.getShoeWeight;
  private getClothingDimensions = this.getShoeDimensions;

  getScrapingStatus() {
    return this.scrapingStatus;
  }
}
