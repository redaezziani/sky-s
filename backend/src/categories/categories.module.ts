import { Module } from '@nestjs/common';
import { CategoriesService } from './private/categories.service';
import { CategoriesController } from './private/categories.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PublicCategoriesController } from './public/public-categories.controller';
import { PublicCategoriesService } from './public/public-categories.service';

@Module({
  controllers: [CategoriesController, PublicCategoriesController],
  providers: [CategoriesService, PublicCategoriesService, PrismaService],
  exports: [CategoriesService, PublicCategoriesService],
})
export class CategoriesModule {}
