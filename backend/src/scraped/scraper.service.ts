// scraper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageKitService } from '../common/services/imagekit.service';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Page } from 'puppeteer';

// Define the structure for the Namshi product data
interface NamshiProduct {
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  discount: string;
  currency: string;
  rating: number;
  sizes: string; // e.g., 'S@M@L'
  quantity: number;
  cover_img: string;
  prev_imgs: string; // e.g., 'url1@url2@url3'
  category_id: number; // Placeholder category ID
  slug: string;
  shipping: string;
  colors: string; // e.g., 'red@blue'
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  
  // 1. URL CHANGE: Updated Base URL
  // Assuming the user wants the raw URL for 'bona_fide' products
  private readonly baseUrl = 'https://www.namshi.com/uae-en/bona_fide'; 
  
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
  private readonly productCategoryId = 'aedd6b70-d4f6-44d3-8d3f-6dd9eeaf3bf7'; 

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
  // 🎯 MAIN PUPPETEER SCRAPING LOGIC
  // --------------------------------------------------------------------------------

  async scrapeNamshiCaps(maxPages: number = 10, productsThreshold: number = 3) {
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
    
    let browser;
    const allProducts: NamshiProduct[] = [];

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
      
      // Set User-Agent and increase timeout
      await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      let currentPage = 1;
      let hasNextPage = true;
      const NAV_DELAY_MS = 3000;

      while (hasNextPage && currentPage <= maxPages) {
          // Construct URL with page number, maintaining the base structure
          const pageUrl = `${this.baseUrl}?page=${currentPage}`;
          this.logger.log(`Scraping page ${currentPage}: ${pageUrl}`);
          this.scrapingStatus.currentPage = currentPage;
          
          if (currentPage > 1) {
              this.logger.debug(`Waiting for ${NAV_DELAY_MS / 1000} seconds before next navigation...`);
              await this.delay(NAV_DELAY_MS);
          }
          
          try {
              // 2. Navigate
              await page.goto(pageUrl, { 
                  waitUntil: 'networkidle2',
                  timeout: 60000 
              });
              
              // 3. Handle Cookies (Attempt to close cookie banner)
              await page.evaluate(() => {
                  const acceptButton = document.querySelector('#onetrust-accept-btn-handler') || 
                                       document.querySelector('.cookie-consent-button');
                  if (acceptButton) {
                      (acceptButton as HTMLElement).click();
                  }
              }).catch(e => this.logger.debug('No visible cookie banner found or click failed.'));

              // 4. Wait for Products
              // 2. SELECTOR CHANGE: Wait for the main content wrapper
              await page.waitForSelector('.ProductListingContent_contentWrapper__eXQQ6', { timeout: 10000 });
              
              // 5. Scrape Products from Page
              const pageProducts = await this.scrapeProductsFromPage(page);
              this.logger.log(`Found ${pageProducts.length} products on page ${currentPage}`);
              
              allProducts.push(...pageProducts);
              
              // 6. Check Delimiter
              if (pageProducts.length < productsThreshold) {
                  this.logger.log(`Reached delimiter condition: only ${pageProducts.length} products found (threshold: ${productsThreshold})`);
                  hasNextPage = false;
              } else {
                  currentPage++;
              }
          } catch (error) {
              this.logger.error(`Error during page ${currentPage} scraping:`, error.message);
              this.scrapingStatus.errors.push(`Page ${currentPage}: ${error.message}`);
              // Stop on critical error like net::ERR_HTTP2_PROTOCOL_ERROR
              break; 
          }
      }

      // 7. Process all products for DB save
      this.scrapingStatus.totalProducts = allProducts.length;
      this.logger.log(`Found total ${allProducts.length} products. Starting DB processing...`);

      for (const product of allProducts) {
          try {
              // Note: detailed scraping is not needed here as all details are extracted at once
              await this.processAndSaveProduct(product, this.productCategoryId);
              this.scrapingStatus.processedProducts++;
              this.logger.log(`Processed ${this.scrapingStatus.processedProducts}/${this.scrapingStatus.totalProducts} products`);
          } catch (error) {
              this.logger.error(`Error processing product ${product.name}:`, error.message);
              this.scrapingStatus.errors.push(`Product ${product.name}: ${error.message}`);
          }
      }

      return {
          totalScraped: allProducts.length,
          totalProcessed: this.scrapingStatus.processedProducts,
          errors: this.scrapingStatus.errors,
      };

    } catch (error) {
      this.logger.error('Error during main scraping process:', error.message);
      throw error;
    } finally {
      if (browser) await browser.close();
      this.scrapingStatus.isRunning = false;
    }
  }

  // --------------------------------------------------------------------------------
  // 📦 PUPPETEER EVALUATION CODE (Scrapes product data from one page)
  // --------------------------------------------------------------------------------
  private async scrapeProductsFromPage(page: Page): Promise<NamshiProduct[]> {
      return await page.evaluate((): NamshiProduct[] => {
          const cleanImageUrl = (url: string): string => url.replace(/\?.*$/, '');
          
          // 2. SELECTOR CHANGE: Target the product boxes within the content wrapper
          const productElements = document.querySelectorAll(
              '.ProductListingContent_contentWrapper__eXQQ6 .ProductBox_container__wiajf.ProductBox_boxContainer__p7PaQ'
          );
          
          if (productElements.length === 0) {
              console.error('No product elements found on this page.');
              return [];
          }
          
          const productArray: NamshiProduct[] = [];
          
          productElements.forEach((element) => {
              // SELECTOR REFINEMENT: Updated selectors based on the new HTML
              const brand = element.querySelector('.ProductBox_brand__oDc9f')?.textContent?.trim() || '';
              const simpleName = element.querySelector('.ProductBox_productTitle__6tQ3b')?.textContent?.trim() || '';
              const name = `${brand} ${simpleName}`;

              // Get images (unchanged, still looks correct)
              const images = Array.from(
                  new Set(
                      Array.from(element.querySelectorAll('.ProductImage_imageContainer__B5pcR img'))
                          .map(img => img.getAttribute('src'))
                          .filter((src): src is string => !!src)
                          .map(src => cleanImageUrl(src))
                  )
              );

              // Extract price information
              // SELECTOR REFINEMENT: ProductPrice_sellingPrice__y8kib is now the container
              const priceContainer = element.querySelector('.ProductPrice_sellingPrice__y8kib');
              const currency = priceContainer?.querySelector('.ProductPrice_currency__issmK')?.textContent?.trim() || '';
              const value = priceContainer?.querySelector('.ProductPrice_value__hnFSS')?.textContent?.trim() || '0';
              
              // The original price (if available) seems to be absent in the current snippet's primary price display,
              // but we'll stick to the old structure for now (assuming it might appear elsewhere or on sale items).
              // Since the provided HTML only shows a single large price, 'originalPriceValue' might be 0/null often.
              // For now, we'll keep the logic that looks for a 'preReductionPrice' or similar field if one exists.
              const originalPrice = element.querySelector('.ProductPrice_preReductionPrice__S72wT')?.textContent?.trim() || '0';
              const discount = element.querySelector('.ProductDiscountTag_text__pMIbD')?.textContent?.trim() || ''; // Use parent tag for the text content
              const shipping = element.querySelector('.RotatingElements_container__cS80Q')?.textContent?.trim() || 'Paid Shipping';


              const price = parseFloat(value.replace(/,/g, ''));
              // Keep original_price logic as-is, which handles null/0 if no separate original price is found.
              const originalPriceValue = parseFloat(originalPrice.replace(/,/g, '')) || null; 

              // Generate random/dummy data for required fields (unchanged)
              const rating = Math.floor(Math.random() * 5) + 2;
              const quantity = Math.floor(Math.random() * 300) + 1;
              const sizeList = ['S', 'M', 'L', 'XL', 'XXL'];
              const sizes = sizeList.sort(() => 0.5 - Math.random()).slice(0, 3).join('@');
              const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
              const colorList = ['red', 'yellow', 'green', 'blue', 'indigo', 'purple', 'pink', 'gray', 'black', 'white'];
              const colors = colorList.sort(() => 0.5 - Math.random()).slice(0, 3).join('@');
              
              productArray.push({
                  name,
                  description: `Stay Warm, Stay Stylish. Product: ${name}.`,
                  price: price,
                  original_price: originalPriceValue,
                  discount: discount,
                  currency: currency,
                  rating,
                  sizes,
                  quantity,
                  cover_img: images[0] || '',
                  prev_imgs: images.join('@'),
                  category_id: 3, // Dummy ID
                  slug,
                  shipping,
                  colors,
              });
          });

          return productArray;
      });
  }

  // --------------------------------------------------------------------------------
  // 💾 IMAGE AND DATABASE PERSISTENCE (Only the save function needed a change)
  // --------------------------------------------------------------------------------
  
  // Renamed to fit the new product type
  private async processAndSaveProduct(
    product: NamshiProduct,
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
          folder: `products/namshi/${this.sanitizeFileName(productName)}`,
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
  
  // Adapted your original saveProductToDatabase to accept the new product structure
  private async saveProductToDatabase(
    product: NamshiProduct,
    imageUrls: string[],
    categoryId: string,
  ): Promise<void> {
    const sizeArray = product.sizes.split('@');
    const colorArray = product.colors.split('@');

    // Create or connect to Color/Size attributes if necessary in your prisma setup,
    // for simplicity, we focus on the Product and Variant creation.

    await this.prisma.product.create({
      data: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        shortDesc: `A stylish ${product.colors.split('@')[0]} cap. ${product.shipping}`,
        coverImage: imageUrls[0],
        isFeatured: product.rating > 4, // Use rating as a proxy
        metaTitle: `${product.name} - Buy ${product.currency}`,
        metaDesc: product.description,
        isActive: true,
        sortOrder: 0,
        categories: {
          connect: { id: categoryId },
        },
        variants: {
          create: sizeArray.map((size, index) => ({
            name: `${size} / ${colorArray[index % colorArray.length]}`,
            attributes: { size, color: colorArray[index % colorArray.length] },
            isActive: true,
            sortOrder: index,
            skus: {
              create: [
                {
                  sku: this.generateSku(product.name, size),
                  price: product.price,
                  // FIX: Changed from originalPrice to comparePrice to match the Prisma Schema
                  comparePrice: product.original_price, 
                  stock: product.quantity,
                  weight: 300, 
                  dimensions: { length: 20, width: 20, height: 10, size },
                  coverImage: imageUrls[0],
                  lowStockAlert: 2,
                  isActive: true,
                  images: {
                    create: imageUrls.map((url, idx) => ({
                      url,
                      altText: `${product.name} ${size} view ${idx + 1}`,
                      position: idx,
                    })),
                  },
                },
              ],
            },
          })),
        },
      },
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

  private generateSku(title: string, size: string): string {
    const prefix = title
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 8);
    const sizeCode = size.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `${prefix}-${sizeCode}-${Date.now()}`;
  }

  getScrapingStatus() {
    return this.scrapingStatus;
  }
}