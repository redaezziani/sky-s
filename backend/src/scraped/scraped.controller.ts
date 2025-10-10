// scraped.controller.ts
import { Controller, Post, Get, Logger } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraped')
export class ScrapedController {
  private readonly logger = new Logger(ScrapedController.name);

  constructor(private readonly scraperService: ScraperService) {}

  @Post('scrape-parfums')
  async scrapeParfums(): Promise<{ success: boolean; message: string; data?: any; error?: string }> {
    this.logger.log('Starting parfum scraping process...');
    try {
      const result = await this.scraperService.scrapeOnlyProductDetail("https://www.only.com/de-de/product/15277952_2161/kapuze-tief-angesetzte-schulter-jacke");
      return {
        success: true,
        message: 'Scraping completed successfully',
        data: result,
      };
    } catch (error) {
      this.logger.error('Scraping failed:', error);
      return {
        success: false,
        message: 'Scraping failed',
        error: error.message,
      };
    }
  }

  @Get('test-scrape')
  getScrapingStatus(): { isRunning: boolean; currentPage: number; totalProducts: number; processedProducts: number; errors: string[] } {
    return this.scraperService.getScrapingStatus();
  }
}
