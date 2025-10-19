import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageKitService } from '../common/services/imagekit.service';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Page } from 'puppeteer';

// Define the structure for the NEW Mason Garments product data
interface MasonGarmentsItem {
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  discount: string;
  currency: string;
  rating: number;
  sizes: string; // e.g., '39@40@41'
  colors: string; // e.g., 'Black@Grey@White'
  quantity: number;
  cover_img: string;
  prev_imgs: string; // e.g., 'url1@url2@url3'
  category_id: number; // Placeholder category ID
  slug: string;
  shipping: string;
  material: string; // e.g., 'Suede, nubuck and leather'
  articleNumber: string; // Product number (placeholder, not clearly visible on page)
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);

  // 1. URL CHANGE: Updated Base URL for Mason Garments (for testing)
  private readonly baseUrl = 'https://www.masongarments.com/products/genova-multicolore-black';

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

  // Hardcoded category ID (Use a valid UUID for your Prisma schema)
  private readonly productCategoryId = '70b5a005-e11a-4368-bbb9-f22f1ca13333';

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

  // Helper function for delay (from original code)
  private delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

  // --------------------------------------------------------------------------------
  // 識 MAIN PUPPETEER SCRAPING LOGIC (FIXED FOR VARIANT HANDLING)
  // --------------------------------------------------------------------------------

  async scrapeOnlyProductDetail(productUrl: string): Promise<MasonGarmentsItem> {
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
      // 1. Launch Browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--single-process'
        ]
      });
      const page = await browser.newPage();

      // Set User-Agent and viewport
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      await page.setViewport({ width: 1920, height: 1080 });

      this.logger.log(`Scraping product: ${productUrl}`);

      // 2. Navigate to product page
      await page.goto(productUrl, {
        waitUntil: 'networkidle2',
        timeout: 60000
      });

      // 3. Handle Cookies (Assuming a similar Shopify-based cookie banner as ONLY)
      await page.evaluate(() => {
        const acceptButton = document.querySelector('#onetrust-accept-btn-handler') ||
          document.querySelector('.cookie-consent-button') ||
          document.querySelector('[data-cy="cookie-banner-accept"]');
        if (acceptButton) {
          (acceptButton as HTMLElement).click();
        }
      }).catch(e => this.logger.debug('No visible cookie banner found or click failed.'));

      // 4. Wait for product detail elements
      await page.waitForSelector('.product-title', { timeout: 10000 });

      // 5. Scrape static product details (runs once)
      const baseProduct = await this.scrapeStaticProductDetails(page);

      // --- V A R I A N T   S C R A P I N G   L O G I C (Shoes) ---

      // Sets to collect unique data across all variants
      const allImages: Set<string> = new Set();
      const allSizes: Set<string> = new Set();
      const allColors: Set<string> = new Set();

      // Scrape all available size elements first
      // Targeting the size swatches: variant-picker__option-values > block-swatch
      const sizeOptionElements = await page.$$('.variant-picker__option-values .block-swatch:not(.is-disabled)');

      if (sizeOptionElements.length === 0) {
        this.logger.warn('No active size variants found. Falling back to initial view data.');
        // Scrape initial variant data if no sizes found (will cover image/color)
        const initialVariantData = await this.scrapeCurrentVariantData(page);
        initialVariantData.images.forEach(img => allImages.add(img));
        initialVariantData.sizes.forEach(size => allSizes.add(size));
        allColors.add(initialVariantData.color);

      } else {
        this.logger.log(`Found ${sizeOptionElements.length} active size variants to iterate through.`);

        // Iterate through all active size swatches
        for (let i = 0; i < sizeOptionElements.length; i++) {
          const sizeEl = sizeOptionElements[i];

          // Click the size option to load variant-specific details (if any) and refresh images
          // We need to re-fetch the element inside the loop as the DOM might change after a click
          const currentSizeEl = (await page.$$('.variant-picker__option-values .block-swatch:not(.is-disabled)'))[i];
          if (!currentSizeEl) continue;

          // Extract and collect the size text immediately
          const sizeText = await page.evaluate(el => el.textContent?.trim(), currentSizeEl);
          if (sizeText) allSizes.add(sizeText);

          // Click the element
          await currentSizeEl.click().catch(e => this.logger.warn(`Failed to click size swatch ${sizeText}: ${e.message}`));

          // Wait for the UI to update (images change)
          await this.delay(1000);

          // Scrape variant-specific data (images and current color)
          const variantData = await this.scrapeCurrentVariantData(page);

          // Aggregate images and color
          variantData.images.forEach(img => allImages.add(img));
          allColors.add(variantData.color);

          this.logger.debug(`Scraped size variant ${sizeText}. Current Color: ${variantData.color}. Images: ${variantData.images.length}`);
        }
      }

      // Collect all *other* color options from the media swatches regardless of the currently selected size
      const colorSwatchElements = await page.$$('.variant-picker__option-values.wrap a.media-swatch');
      if (colorSwatchElements.length > 0) {
        for (const colorEl of colorSwatchElements) {
          const imgElement = await colorEl.waitForSelector('img'); // Ensure image is loaded before attempting attribute retrieval
          const altText = await page.evaluate(el => el.getAttribute('alt'), imgElement);
          // Example alt: "Genova Multicolore Black - Mason Garments"
          if (altText) {
            const colorMatch = altText.match(/Genova\s+(.*)\s-\sMason/i);
            if (colorMatch && colorMatch[1]) {
              allColors.add(colorMatch[1].trim());
            }
          }
        }
      }


      // 6. Finalize the product object with aggregated data
      const finalProduct: MasonGarmentsItem = {
        ...baseProduct,
        sizes: Array.from(allSizes).join('@'),
        colors: Array.from(allColors).join('@'),
        // Use the first scraped image as the cover image
        cover_img: Array.from(allImages)[0] || baseProduct.cover_img,
        prev_imgs: Array.from(allImages).join('@'),
      };

      this.logger.log(`Successfully scraped product: ${finalProduct.name}. Total Images: ${allImages.size}, Total Sizes: ${allSizes.size}, Total Colors: ${allColors.size}`);

      // 7. Process and save to database
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

  // Keep the old method for backward compatibility but mark as deprecated
  async scrapeOnlyClothing(maxPages: number = 1, productsThreshold: number = 3) {
    this.logger.warn('scrapeOnlyClothing is deprecated. Use scrapeOnlyProductDetail for individual products.');
    throw new Error('This method is deprecated. Use scrapeOnlyProductDetail(url) to scrape individual product pages.');
  }

  // --------------------------------------------------------------------------------
  // 逃 PUPPETEER EVALUATION CODE - Extracts static product data (runs once)
  // --------------------------------------------------------------------------------
  private async scrapeStaticProductDetails(page: Page): Promise<MasonGarmentsItem> {
    return await page.evaluate((): MasonGarmentsItem => {

      // Clean up image URLs
      const cleanImageUrl = (url: string): string => {
        if (!url) return '';
        // Strip Shopify specific parameters like ?v=...&width=...
        const clean = url.split('?')[0];
        // Ensure it has the protocol (it comes with //)
        return clean.startsWith('//') ? `https:${clean}` : clean;
      };


      // Extract product title
      const titleElement = document.querySelector('.product-title');
      const name = titleElement?.textContent?.replace('&nbsp;', '').trim() || 'Mason Garments Product'; // [cite: 1]

      // Extract price information
      const priceElement = document.querySelector('.price-list sale-price');
      // Use price-list.sale-price selector for the price, which is 425 EUR [cite: 4]
      const priceText = priceElement?.textContent?.trim().replace('Sale price', '') || '0 EUR';
      const priceMatch = priceText.match(/(\d+(?:[.,]\d+)?)/);
      const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;

      // Extract currency (Assuming it's always EUR for this site)
      const currency = priceText.includes('EUR') ? 'EUR' : '€';

      // Look for original price (compare at price)
      // Note: The HTML shows the same price for sale and regular price, so it's not discounted [cite: 4]
      const originalPriceElement = document.querySelector('.price-list compare-at-price:not([hidden])');
      const originalPriceText = originalPriceElement?.textContent?.trim().replace('Regular price', '') || '';
      const originalPriceMatch = originalPriceText.match(/(\d+(?:[.,]\d+)?)/);
      const originalPrice = originalPriceMatch ? parseFloat(originalPriceMatch[1].replace(',', '.')) : null;

      // Discount field is not clearly visible on the target page
      const discount = '';

      // Extract product description from the prose block
      let description = '';
      const descriptionElement = document.querySelector('#description_area .prose');
      if (descriptionElement) {
        // Extract all text content, clean up excessive newlines/spaces, and trim
        description = descriptionElement.textContent?.replace(/\n\s*\n/g, '\n').trim() || '';// [cite: 2, 3, 4]
      }

      // Extract material composition from "PRODUCT DETAILS" accordion
      let material = '';
      // Selector for the content of the "PRODUCT DETAILS" accordion, specifically the list items [cite: 25]
      const materialListItems = document.querySelectorAll('#product_details .accordion__content li');
      if (materialListItems.length > 0) {
        // Find the list item that mentions the material composition
        const materialItem = Array.from(materialListItems).find(li =>
          li.textContent?.toLowerCase().includes('suede') ||
          li.textContent?.toLowerCase().includes('nubuck') ||
          li.textContent?.toLowerCase().includes('leather')
        );
        if (materialItem) {
          material = materialItem.textContent?.trim() || 'Suede, nubuck and leather upper from Italian tanneries';// [cite: 25]
        }
      }
      if (!material) {
        // Fallback to the explicit description from the details
        material = 'Suede, nubuck and leather upper from Italian tanneries';// [cite: 25]
      }


      // Article number is not clearly visible; using slug for placeholder
      let articleNumber = '';
      const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
      const urlMatch = window.location.href.match(/\/products\/([^\/]+)/);
      if (urlMatch && urlMatch[1]) {
        // Use the slug part of the URL as a base for articleNumber (or generate a placeholder)
        articleNumber = urlMatch[1].toUpperCase().replace(/-/g, '').substring(0, 10);
      } else {
        articleNumber = `${Math.floor(Math.random() * 90000000) + 10000000}`;
      }


      // Extract initial cover image from the main product gallery for a fallback
      // Targeting the image inside the initial product-gallery__media element [cite: 66]
      const initialCoverImageElement = document.querySelector('.product-gallery__media.is-initial img');
      const initialCoverImg = cleanImageUrl(initialCoverImageElement?.getAttribute('src') || initialCoverImageElement?.getAttribute('data-src') || '');

      // Generate realistic values
      const rating = 5; // Assuming high quality for a handmade Italian product
      const quantity = Math.floor(Math.random() * 20) + 10; // 10-30 in stock

      // Extract shipping text (from the accordion)
      // The shipping details are in a table inside the shipping_and_payment accordion [cite: 37, 38]
      const shippingDetailsElement = document.querySelector('#shipping_and_payment .accordion__content');
      let shipping = 'See shipping details.';
      if (shippingDetailsElement) {
        const firstParagraph = shippingDetailsElement.querySelector('p');
        const table = shippingDetailsElement.querySelector('table');

        const text = (firstParagraph?.textContent?.trim() || '') + ' ' + (table?.textContent?.trim() || '');
        // Clean up excess whitespace and format
        shipping = text.replace(/\s+/g, ' ').trim().substring(0, 300);
      }
      if (!shipping || shipping.length < 50) {
        shipping = 'Mason Garments provides worldwide shipping through local carriers. All shipping services provide a tracking number. See shipping table for details.';// [cite: 37, 38]
      }


      // Initial placeholders for variant data (will be overwritten by variant loop)
      return {
        name,
        description,
        price,
        original_price: originalPrice,
        discount,
        currency,
        rating,
        sizes: '', // To be filled in the loop
        colors: '', // To be filled in the loop
        quantity,
        cover_img: initialCoverImg,
        prev_imgs: '', // To be filled in the loop
        category_id: 4,
        slug,
        shipping,
        material,
        articleNumber,
      };
    });
  }

  // --------------------------------------------------------------------------------
  // 逃 PUPPETEER EVALUATION CODE - Extracts variant-specific data (runs in a loop)
  // --------------------------------------------------------------------------------
  private async scrapeCurrentVariantData(page: Page): Promise<{ images: string[], sizes: string[], color: string }> {
    return await page.evaluate(() => {
      const cleanImageUrl = (url: string): string => {
        if (!url) return '';
        // Strip Shopify specific parameters like ?v=...&width=...
        const clean = url.split('?')[0];
        // Ensure it has the protocol (it comes with //)
        return clean.startsWith('//') ? `https:${clean}` : clean;
      };

      // 1. Extract current color
      let currentColor = 'Unknown';

      // FIX: Use standard DOM traversal instead of non-standard :has()/:contains() selector.
      const colorLabel = Array.from(document.querySelectorAll('.variant-picker__option .h-stack > p.text-subdued'))
        .find(p => p.textContent?.trim() === 'Color:');

      if (colorLabel && colorLabel.nextElementSibling) {
        const colorTextElement = colorLabel.nextElementSibling;
        if (colorTextElement.textContent?.trim()) {
          currentColor = colorTextElement.textContent.trim();
        }
      }

      // Fallback: look for the alt text of the selected image swatch
      if (currentColor === 'Unknown' || !currentColor) {
        const selectedColorSwatchImg = document.querySelector('.variant-picker__option-values a.media-swatch.is-selected img');
        const altText = selectedColorSwatchImg?.getAttribute('alt');
        if (altText) {
          const colorMatch = altText.match(/Genova\s+(.*)\s-\sMason/i);
          if (colorMatch && colorMatch[1]) {
            currentColor = colorMatch[1].trim();
          }
        }
      }

      // Fallback to name if all else fails
      if (currentColor === 'Unknown' || !currentColor) {
        const titleElement = document.querySelector('.product-title');
        const name = titleElement?.textContent?.replace('&nbsp;', '').trim() || '';// [cite: 1]
        // Match anything after 'Genova' in the title
        const nameColorMatch = name.match(/Genova\s+(.*)\s*/i);
        if (nameColorMatch && nameColorMatch[1]) {
          currentColor = nameColorMatch[1].trim();
        }
      }

      const sizeElements = document.querySelectorAll('.variant-picker__option-values .block-swatch:not(.is-disabled) span');
      const availableSizes: string[] = Array.from(sizeElements)
        .map(sizeEl => sizeEl.textContent?.trim())
        .filter((size): size is string => !!size);

      // 3. Extract product images from gallery for this variant
      // Targets the main image and any other gallery-related image element
      const imageElements = document.querySelectorAll('product-gallery-image img, .flickity-slider img');// [cite: 67, 68, 69, 70]

      const images = Array.from(
        new Set(
          Array.from(imageElements)
            .map(img => img.getAttribute('src') || img.getAttribute('data-src') || img.getAttribute('srcset')?.split(',')[0].trim().split(' ')[0])
            .filter((src): src is string => !!src && src.includes('masongarments.com'))
            .map(src => cleanImageUrl(src))
        )
      );

      // Deduplicate and return
      return {
        images: Array.from(new Set(images)),
        sizes: Array.from(new Set(availableSizes)),
        color: currentColor
      };
    });
  }

  // --------------------------------------------------------------------------------
  // 沈 IMAGE AND DATABASE PERSISTENCE
  // --------------------------------------------------------------------------------

  // Renamed to fit the new product type
  private async processAndSaveProduct(
    product: MasonGarmentsItem,
    categoryId: string,
  ): Promise<void> {
    // Note: The product interface name is different but the function signature remains the same structure as required by the update.
    const existingProduct = await this.prisma.product.findUnique({
      where: { slug: product.slug },
    });

    if (existingProduct) {
      this.logger.debug(`Product already exists: ${product.name}`);
      return;
    }

    // Convert the single '@' separated string of URLs back to an array
    const imageUrls = product.prev_imgs.split('@').filter(url => url);

    // Download and upload images (re-using your existing logic)
    const uploadedImageUrls = await this.downloadAndUploadImages(product.name, imageUrls);

    if (uploadedImageUrls.length === 0) {
      this.logger.warn(`No images uploaded for product: ${product.name}`);
      return;
    }

    // Save product to database
    await this.saveProductToDatabase(
      product,
      uploadedImageUrls,
      categoryId,
    );
  }


  // Adapted your original downloadAndUploadImages to accept the new product structure
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

        // Ensure we fetch the full size image, e.g., by checking for a width parameter and removing it
        const cleanUrl = imageUrl.replace(/&width=\d+/i, '');

        const response = await fetch(cleanUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
        });

        // Use node's fs/stream to write the file
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
    } catch { }
    return uploadedUrls;
  }

  // Adapted to save shoe products to database
  private async saveProductToDatabase(
    product: MasonGarmentsItem,
    imageUrls: string[],
    categoryId: string,
  ): Promise<void> {
    const sizeArray = product.sizes.split('@').filter(s => s);
    const colorArray = product.colors.split('@').filter(c => c);

    // Fallback if no sizes were found
    if (sizeArray.length === 0) {
      this.logger.warn('No sizes scraped. Defaulting to size 42.');
      sizeArray.push('42');
    }
    // Fallback if no colors were found
    if (colorArray.length === 0) {
      this.logger.warn('No colors scraped. Defaulting to Black.');
      colorArray.push('Black');
    }

    // Generate detailed short description for shoes
    const shortDesc = `Handmade in Italy, the Mason Garments ${product.name} sneakers feature a premium ${product.material} upper and custom rubber outsole. Recommended to take one size up. Available in sizes ${sizeArray[0]}-${sizeArray[sizeArray.length - 1]}.`;// [cite: 25, 27]

    // Console log all the data we're trying to insert
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
      isFeatured: product.rating >= 4.5, // High rating for featured
      metaTitle: `${product.name} - Mason Garments Sneakers | ${product.currency}`,
      metaDesc: `${product.description.substring(0, 160)}...`,
      isActive: true, // Assuming new products should be active
      sortOrder: 0,
      categories: {
        connect: { id: '70b5a005-e11a-4368-bbb9-f22f1ca13333' },
      },
      variants: {
        // Create a variant for every combination of size and color
        create: sizeArray.flatMap((size, sizeIndex) =>
          colorArray.map((color, colorIndex) => ({
            name: `${size} - ${color}`,
            attributes: {
              size,
              color,
              material: product.material,
              articleNumber: product.articleNumber,
              brand: 'Mason Garments'
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
          }))
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

  // --------------------------------------------------------------------------------
  // 笞呻ｸUTILITIES (Adapted for Shoes)
  // --------------------------------------------------------------------------------

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

  // Helper methods for shoe size-based calculations
  private getShoeWeight(size: string): number {
    const sizeNumber = parseInt(size, 10);
    // Base weight for a sneaker, increases slightly with size
    const baseWeight = 850;
    if (sizeNumber < 40) return baseWeight - 50;
    if (sizeNumber > 45) return baseWeight + 150;
    return baseWeight + (sizeNumber - 40) * 25; // Weight in grams
  }

  private getShoeDimensions(size: string): any {
    const sizeNumber = parseInt(size, 10);
    // Base dimensions for a shoebox, increases slightly with size
    const baseLength = 30;
    const baseWidth = 20;
    const baseHeight = 12;

    const length = baseLength + Math.floor((sizeNumber - 40) * 0.5);
    const width = baseWidth;
    const height = baseHeight;

    return { length, width, height, size }; // Dimensions in cm
  }

  // Keep old names for backward compatibility with existing usage if any
  private getClothingWeight = this.getShoeWeight;
  private getClothingDimensions = this.getShoeDimensions;

  getScrapingStatus() {
    return this.scrapingStatus;
  }
}
