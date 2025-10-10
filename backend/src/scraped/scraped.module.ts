// scraped.module.ts
import { Module } from '@nestjs/common';
import { ScrapedController } from './scraped.controller';
import { ScraperService } from './scraper.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageKitService } from '../common/services/imagekit.service';

@Module({
  controllers: [ScrapedController],
  providers: [ScraperService, PrismaService, ImageKitService],
  exports: [ScraperService],
})
export class ScrapedModule {}
