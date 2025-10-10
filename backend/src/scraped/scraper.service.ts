import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageKitService } from '../common/services/imagekit.service';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Page } from 'puppeteer';

// Define the structure for the ONLY clothing product data
interface OnlyClothingItem {
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  discount: string;
  currency: string;
  rating: number;
  sizes: string; // e.g., 'XS@S@M@L@XL'
  colors: string; // e.g., 'Black@White@Blue'
  quantity: number;
  cover_img: string;
  prev_imgs: string; // e.g., 'url1@url2@url3'
  category_id: number; // Placeholder category ID
  slug: string;
  shipping: string;
  material: string; // e.g., '90% Polyamid, 10% Elasthan'
  articleNumber: string; // Product number
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  
  // 1. URL CHANGE: Updated Base URL for ONLY clothing
  private readonly baseUrl = 'https://www.only.com/de-de/product/15107599_2076/breite-traager-bh'; 
  
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
  private readonly productCategoryId = '3412b464-b8e6-44ff-9c87-7503c6986b7b'; 

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
  // 🎯 MAIN PUPPETEER SCRAPING LOGIC (FIXED FOR VARIANT HANDLING)
  // --------------------------------------------------------------------------------

  async scrapeOnlyProductDetail(productUrl: string): Promise<OnlyClothingItem> {
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
      
      // 3. Handle Cookies
      await page.evaluate(() => {
          const acceptButton = document.querySelector('#onetrust-accept-btn-handler') || 
                               document.querySelector('.cookie-consent-button') ||
                               document.querySelector('[data-cy="cookie-banner-accept"]');
          if (acceptButton) {
              (acceptButton as HTMLElement).click();
          }
      }).catch(e => this.logger.debug('No visible cookie banner found or click failed.'));

      // 4. Wait for product detail elements
      await page.waitForSelector('.product-detail__title', { timeout: 10000 });
      
      // 5. Scrape static product details (runs once)
      const baseProduct = await this.scrapeStaticProductDetails(page);
      
      // --- V A R I A N T   S C R A P I N G   L O G I C ---
      
      // Sets to collect unique data across all variants
      const allImages: Set<string> = new Set();
      const allSizes: Set<string> = new Set();
      const allColors: Set<string> = new Set(); 

      // Find all color options by their class and title
      const colorOptionElements = await page.$$('.style-option[title*="Farbe auswählen:"]');
      
      if (colorOptionElements.length > 0) {
        this.logger.log(`Found ${colorOptionElements.length} color variants to iterate through.`);
        
        for (let i = 0; i < colorOptionElements.length; i++) {
          const colorEl = colorOptionElements[i];
          
          // Click the color option to load variant-specific images and sizes
          await colorEl.click();
          
          // Wait for the UI to update (images and size swatches change)
          await this.delay(1500); // Increased delay for slower networks/rendering
          await page.waitForSelector('.product-gallery-simple__image img, .variant-swatch .label', { timeout: 5000 }).catch(e => {
            this.logger.warn(`Failed to wait for variant update on color ${i}. Proceeding.`);
          });
          
          // Scrape variant-specific data (images and sizes for this color)
          const variantData = await this.scrapeCurrentVariantData(page);
          
          // Aggregate
          variantData.images.forEach(img => allImages.add(img));
          variantData.sizes.forEach(size => allSizes.add(size));
          allColors.add(variantData.color);

          this.logger.debug(`Scraped variant ${variantData.color}. Images: ${variantData.images.length}, Sizes: ${variantData.sizes.join(',')}`);
        }
        
      } 
      
      // Always scrape the initial view's variant data if no explicit variants were found 
      // or to ensure the data from the initially loaded page is included.
      const initialVariantData = await this.scrapeCurrentVariantData(page);
      initialVariantData.images.forEach(img => allImages.add(img));
      initialVariantData.sizes.forEach(size => allSizes.add(size));
      allColors.add(initialVariantData.color);

      // 6. Finalize the product object with aggregated data
      const finalProduct: OnlyClothingItem = {
          ...baseProduct,
          sizes: Array.from(allSizes).join('@') || baseProduct.sizes,
          colors: Array.from(allColors).join('@') || baseProduct.colors,
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
  // 📦 PUPPETEER EVALUATION CODE - Extracts static product data (runs once)
  // --------------------------------------------------------------------------------
  private async scrapeStaticProductDetails(page: Page): Promise<OnlyClothingItem> {
      return await page.evaluate((): OnlyClothingItem => {
          
          // Extract product title
          const titleElement = document.querySelector('.product-detail__title');
          const name = titleElement?.textContent?.trim() || 'ONLY Product';
          
          // Extract price information
          const priceElement = document.querySelector('.product-price__list-price span');
          const priceText = priceElement?.textContent?.trim() || '0';
          const priceMatch = priceText.match(/(\d+(?:[.,]\d+)?)/);
          const price = priceMatch ? parseFloat(priceMatch[1].replace(',', '.')) : 0;
          
          // Extract currency
          const currency = priceText.includes('€') ? '€' : 'EUR';
          
          // Look for original price (sale items)
          const originalPriceElement = document.querySelector('.product-price__original-price, .price-old');
          const originalPriceText = originalPriceElement?.textContent?.trim() || '';
          const originalPriceMatch = originalPriceText.match(/(\d+(?:[.,]\d+)?)/);
          const originalPrice = originalPriceMatch ? parseFloat(originalPriceMatch[1].replace(',', '.')) : null;
          
          // Look for discount
          const discountElement = document.querySelector('.product-detail__badge, .discount-badge');
          const discount = discountElement?.textContent?.trim() || '';
          
          // Extract product description from accordion (if available)
          let description = '';
          let material = '';
          let articleNumber = '';
          
          // Try to extract detailed description
          const descriptionElement = document.querySelector('.product-description');
          if (descriptionElement) {
              const descText = descriptionElement.textContent?.trim() || '';
              description = descText;
          }
          
          // Extract material composition
          const materialElement = document.querySelector('.fabric-composition');
          if (materialElement) {
              material = materialElement.textContent?.trim() || '';
          }
          
          // Extract article number
          const articleElement = document.querySelector('.article-number');
          if (articleElement) {
              const articleText = articleElement.textContent?.trim() || '';
              const articleMatch = articleText.match(/Produktnummer:\s*(\d+)/);
              if (articleMatch) {
                  articleNumber = articleMatch[1];
              }
          }
          
          // Fallback values if not found
          if (!description) {
              description = `Discover the stylish ${name} from ONLY. This versatile piece offers exceptional quality and comfort, perfect for any occasion.`;
          }
          
          if (!material) {
              material = '90% Polyamide, 10% Elastane'; 
          }
          
          if (!articleNumber) {
              // Try to extract from URL or generate
              const urlMatch = window.location.href.match(/\/(\d+)_/);
              articleNumber = urlMatch ? urlMatch[1] : `${Math.floor(Math.random() * 90000000) + 10000000}`;
          }
          
          // Generate slug from name
          const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
          
          // Generate realistic values
          const rating = Math.floor(Math.random() * 2) + 4; // 4-5 stars
          const quantity = Math.floor(Math.random() * 20) + 5; // 5-25 in stock
          
          // Initial placeholders for variant data (will be overwritten by variant loop)
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
              cover_img: '',
              prev_imgs: '',
              category_id: 4,
              slug,
              shipping: 'Kostenlose Lieferung für Bestellungen über 60 €',
              material,
              articleNumber,
          };
      });
  }

  // --------------------------------------------------------------------------------
  // 📦 PUPPETEER EVALUATION CODE - Extracts variant-specific data (runs in a loop)
  // --------------------------------------------------------------------------------
  private async scrapeCurrentVariantData(page: Page): Promise<{ images: string[], sizes: string[], color: string }> {
    return await page.evaluate(() => {
        const cleanImageUrl = (url: string): string => url.replace(/\?.*$/, '').replace(/&key=.*$/, '');
        
        // 1. Extract current color
        const colorAnnotation = document.querySelector('.product-detail__color-annotation');
        const currentColor = colorAnnotation?.textContent?.trim().split(' / ')[1] || 'Unknown';

        // 2. Extract available sizes for this color
        const sizeElements = document.querySelectorAll('.variant-swatch .label');
        const availableSizes: string[] = Array.from(sizeElements)
            .map(sizeEl => sizeEl.textContent?.trim())
            .filter((size): size is string => !!size);
        
        // 3. Extract product images from gallery for this color
        // Targets both main image and thumbnail images
        const imageElements = document.querySelectorAll('.product-gallery-simple__image img, .product-gallery-simple__thumbnail-slide img');
        
        const images = Array.from(
            new Set(
                Array.from(imageElements)
                    .map(img => img.getAttribute('src') || img.getAttribute('data-src'))
                    .filter((src): src is string => !!src && src.includes('only.com'))
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
  // 💾 IMAGE AND DATABASE PERSISTENCE (Only the save function needed a change)
  // --------------------------------------------------------------------------------
  
  // Renamed to fit the new product type
  private async processAndSaveProduct(
    product: OnlyClothingItem,
    categoryId: string,
  ): Promise<void> {
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

        const response = await fetch(imageUrl, {
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
          folder: `products/only-clothing/${this.sanitizeFileName(productName)}`,
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
  
  // Adapted to save clothing products to database
  private async saveProductToDatabase(
    product: OnlyClothingItem,
    imageUrls: string[],
    categoryId: string,
  ): Promise<void> {
    const sizeArray = product.sizes.split('@');
    const colorArray = product.colors.split('@');

    // Generate detailed short description for clothing
    const shortDesc = `Discover the stylish ${product.name} from ONLY. Made with high-quality ${product.material}, this versatile piece offers both comfort and style. Available in multiple sizes and colors. ${product.shipping}. Article number: ${product.articleNumber}`;

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
      isFeatured: product.rating > 4,
      metaTitle: `${product.name} - ONLY Fashion | ${product.currency}`,
      metaDesc: `${product.description.substring(0, 160)}...`,
      isActive: false,
      sortOrder: 0,
      categories: {
        connect: { id: '3412b464-b8e6-44ff-9c87-7503c6986b7b' },
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
              brand: 'ONLY'
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
                  weight: this.getClothingWeight(size), 
                  dimensions: this.getClothingDimensions(size),
                  coverImage: imageUrls[0],
                  lowStockAlert: 2,
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
  // ⚙️ UTILITIES (Kept from your original service)
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
    return `ONLY-${prefix}-${variantCode}-${Date.now()}`;
  }

  // Helper methods for clothing size-based calculations
  private getClothingWeight(size: string): number {
    const sizeWeights: Record<string, number> = {
      'XS': 150,
      'S': 180,
      'M': 220,
      'L': 250,
      'XL': 300,
      'XXL': 350
    };
    return sizeWeights[size] || 200; // Default weight in grams
  }

  private getClothingDimensions(size: string): any {
    const sizeDimensions: Record<string, any> = {
      'XS': { length: 25, width: 20, height: 2, size },
      'S': { length: 27, width: 22, height: 2, size },
      'M': { length: 30, width: 25, height: 2, size },
      'L': { length: 32, width: 27, height: 2, size },
      'XL': { length: 35, width: 30, height: 3, size },
      'XXL': { length: 38, width: 32, height: 3, size }
    };
    return sizeDimensions[size] || { length: 30, width: 25, height: 2, size };
  }

  getScrapingStatus() {
    return this.scrapingStatus;
  }
}