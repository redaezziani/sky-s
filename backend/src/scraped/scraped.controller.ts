// scraper.controller.ts
import { Controller, Post, Get, Logger } from '@nestjs/common';
import { ScraperService } from './scraper.service';

@Controller('scraper')
export class ScraperController {
  private readonly logger = new Logger(ScraperController.name);

  constructor(private readonly scraperService: ScraperService) {}

  @Post('scrape-parfums')
  async scrapeParfums() {
    this.logger.log('Starting parfum scraping process...');
    try {
      const result = await this.scraperService.scrapeNamshiCaps();
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
  getScrapingStatus() {
    return this.scraperService.getScrapingStatus();
  }
}
