// scraper.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageKitService } from '../common/services/imagekit.service';
import * as fs from 'fs';
import * as path from 'path';
import puppeteer, { Page } from 'puppeteer';

// Define the structure for the Valentino perfume product data
interface ValentinoPerfume {
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  discount: string;
  currency: string;
  rating: number;
  volumes: string; // e.g., '50ml@100ml@150ml'
  quantity: number;
  cover_img: string;
  prev_imgs: string; // e.g., 'url1@url2@url3'
  category_id: number; // Placeholder category ID
  slug: string;
  shipping: string;
  perfumeType: string; // e.g., 'Eau de Parfum@Eau de Toilette'
  notes: string; // e.g., 'Rose@Vanilla@Musk'
}

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  
  // 1. URL CHANGE: Updated Base URL for Valentino perfumes
  private readonly baseUrl = 'https://www.namshi.com/uae-en/beauty/valentino/'; 
  
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
  private readonly productCategoryId = 'b1997237-3211-4855-bbe5-135bffce0fc1'; 

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

  async scrapeValentinoPerfumes(maxPages: number = 1, productsThreshold: number = 3) {
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
    const allProducts: ValentinoPerfume[] = [];

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
  private async scrapeProductsFromPage(page: Page): Promise<ValentinoPerfume[]> {
      return await page.evaluate((): ValentinoPerfume[] => {
          const cleanImageUrl = (url: string): string => url.replace(/\?.*$/, '');
          
          // Helper function to generate detailed perfume descriptions
          const generatePerfumeDescription = (brand: string, name: string, type: string): string => {
              const descriptions = [
                  `Discover the captivating essence of ${brand} ${name}, a luxurious fragrance that embodies sophistication and elegance. This exquisite ${type} opens with vibrant top notes that dance on the skin, revealing a heart of precious florals and exotic spices. The composition gracefully settles into a warm, sensual base that lingers throughout the day, creating an unforgettable olfactory signature.`,
                  
                  `Experience the timeless allure of ${brand} ${name}, a masterpiece of Italian craftsmanship. This enchanting ${type} captures the essence of romance and passion, weaving together rare ingredients to create a symphony of scent. Each spray unveils layers of complexity, from the initial burst of freshness to the deep, mysterious dry-down that speaks to the soul.`,
                  
                  `Immerse yourself in the world of ${brand} with ${name}, an extraordinary ${type} that redefines luxury fragrance. Crafted with the finest ingredients from around the globe, this scent tells a story of elegance, power, and seduction. The carefully balanced composition creates a harmonious blend that is both contemporary and timeless, perfect for those who appreciate the finer things in life.`
              ];
              return descriptions[Math.floor(Math.random() * descriptions.length)];
          };
          
          // Helper function to generate short descriptions
          const generateShortDescription = (brand: string, name: string, type: string, notes: string[]): string => {
              return `Indulge in the luxurious ${brand} ${name} ${type}. A sophisticated blend featuring ${notes.slice(0, 3).join(', ')}, this captivating fragrance embodies elegance and refinement. Perfect for special occasions and daily wear, it leaves a lasting impression with its unique and memorable scent profile. Experience the art of Italian perfumery at its finest.`;
          };
          
          // 2. SELECTOR CHANGE: Target the product boxes within the content wrapper
          const productElements = document.querySelectorAll(
              '.ProductListingContent_contentWrapper__eXQQ6 .ProductBox_container__wiajf.ProductBox_boxContainer__p7PaQ'
          );
          
          if (productElements.length === 0) {
              console.error('No product elements found on this page.');
              return [];
          }
          
          const productArray: ValentinoPerfume[] = [];
          
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

              // Generate perfume-specific data
              const rating = Math.floor(Math.random() * 2) + 4; // High ratings for luxury perfumes (4-5)
              const quantity = Math.floor(Math.random() * 50) + 5; // Lower stock for luxury items
              
              // Perfume volumes instead of clothing sizes
              const volumeList = ['30ml', '50ml', '75ml', '100ml', '125ml', '150ml'];
              const volumes = volumeList.sort(() => 0.5 - Math.random()).slice(0, 3).join('@');
              
              // Perfume types
              const perfumeTypes = ['Eau de Parfum', 'Eau de Toilette', 'Parfum', 'Eau Fraiche'];
              const perfumeType = perfumeTypes[Math.floor(Math.random() * perfumeTypes.length)];
              
              // Fragrance notes
              const notesList = [
                  'Rose', 'Jasmine', 'Vanilla', 'Musk', 'Sandalwood', 'Bergamot', 
                  'Patchouli', 'Amber', 'Oud', 'Iris', 'Peony', 'White Tea',
                  'Pink Pepper', 'Tuberose', 'Cedar', 'Vetiver', 'Orange Blossom'
              ];
              const selectedNotes = notesList.sort(() => 0.5 - Math.random()).slice(0, 5);
              const notes = selectedNotes.join('@');
              
              const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
              
              // Generate detailed descriptions
              const detailedDescription = generatePerfumeDescription(brand, simpleName, perfumeType);
              const shortDescription = generateShortDescription(brand, simpleName, perfumeType, selectedNotes);
              
              productArray.push({
                  name,
                  description: detailedDescription,
                  price: price,
                  original_price: originalPriceValue,
                  discount: discount,
                  currency: currency,
                  rating,
                  volumes,
                  quantity,
                  cover_img: images[0] || '',
                  prev_imgs: images.join('@'),
                  category_id: 3, // Dummy ID
                  slug,
                  shipping,
                  perfumeType,
                  notes,
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
    product: ValentinoPerfume,
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
          folder: `products/valentino-perfumes/${this.sanitizeFileName(productName)}`,
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
    product: ValentinoPerfume,
    imageUrls: string[],
    categoryId: string,
  ): Promise<void> {
    const volumeArray = product.volumes.split('@');
    const notesArray = product.notes.split('@');

    // Generate detailed short description for perfumes
    const shortDesc = `Experience the luxurious ${product.name} ${product.perfumeType}. A sophisticated blend featuring ${notesArray.slice(0, 3).join(', ')}, this captivating fragrance embodies elegance and refinement. Perfect for special occasions and daily wear, it leaves a lasting impression with its unique scent profile. ${product.shipping}`;

    // Console log all the data we're trying to insert
    console.log('=== PRODUCT DATA TO INSERT ===');
    console.log('Product:', JSON.stringify(product, null, 2));
    console.log('Image URLs:', imageUrls);
    console.log('Category ID:', categoryId);
    console.log('Volume Array:', volumeArray);
    console.log('Notes Array:', notesArray);
    console.log('Short Description:', shortDesc);
    
    const productData = {
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDesc: shortDesc,
      coverImage: imageUrls[0],
      isFeatured: product.rating > 4,
      metaTitle: `${product.name} - Luxury ${product.perfumeType} | ${product.currency}`,
      metaDesc: `${product.description.substring(0, 160)}...`,
      isActive: false,
      sortOrder: 0,
      categories: {
        connect: { id: '893538f2-54e6-4ff6-ae05-a529ed7848fa' },
      },
      variants: {
        create: volumeArray.map((volume, index) => ({
          name: `${volume} - ${product.perfumeType}`,
          attributes: { 
            volume, 
            type: product.perfumeType,
            notes: notesArray.join(', '),
            concentration: product.perfumeType 
          },
          isActive: true,
          sortOrder: index,
          skus: {
            create: [
              {
                sku: this.generateSku(product.name, volume),
                price: product.price + (index * 20),
                comparePrice: product.original_price ? product.original_price + (index * 25) : null, 
                stock: product.quantity,
                weight: this.getVolumeWeight(volume), 
                dimensions: this.getVolumeDimensions(volume),
                coverImage: imageUrls[0],
                lowStockAlert: 2,
                isActive: true,
                images: {
                  create: imageUrls.map((url, idx) => ({
                    url,
                    altText: `${product.name} ${volume} ${product.perfumeType} view ${idx + 1}`,
                    position: idx,
                  })),
                },
              },
            ],
          },
        })),
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

  private generateSku(title: string, volume: string): string {
    const prefix = title
      .replace(/[^a-zA-Z0-9]/g, '')
      .toUpperCase()
      .substring(0, 8);
    const volumeCode = volume.replace(/[^a-zA-Z0-9]/g, '').toUpperCase();
    return `VAL-${prefix}-${volumeCode}-${Date.now()}`;
  }

  // Helper methods for perfume volume-based calculations
  private getVolumeWeight(volume: string): number {
    const volumeNum = parseInt(volume.replace('ml', ''));
    // Base weight for packaging + liquid weight
    return Math.round(50 + (volumeNum * 0.8)); // Approximate weight in grams
  }

  private getVolumeDimensions(volume: string): any {
    const volumeNum = parseInt(volume.replace('ml', ''));
    
    if (volumeNum <= 30) {
      return { length: 6, width: 4, height: 8, volume };
    } else if (volumeNum <= 50) {
      return { length: 7, width: 5, height: 10, volume };
    } else if (volumeNum <= 100) {
      return { length: 8, width: 6, height: 12, volume };
    } else {
      return { length: 9, width: 7, height: 14, volume };
    }
  }

  getScrapingStatus() {
    return this.scrapingStatus;
  }
}