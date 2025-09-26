// scraper.module.ts
import { Module } from '@nestjs/common';
import { ScraperController } from './scraped.controller';
import { ScraperService } from './scraper.service';
import { PrismaService } from 'src/prisma/prisma.service';
import { ImageKitService } from '../common/services/imagekit.service';

@Module({
  controllers: [ScraperController],
  providers: [ScraperService, PrismaService, ImageKitService],
  exports: [ScraperService],
})
export class ScraperModule {}
