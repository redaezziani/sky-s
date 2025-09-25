import { Module } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { CategoriesController } from './categories.controller';
import { PrismaService } from '../prisma/prisma.service';
import { PublicCategoriesController } from './public-categories.controller';
import { PublicCategoriesService } from './public-categories.service';

@Module({
  controllers: [CategoriesController, PublicCategoriesController],
  providers: [CategoriesService, PublicCategoriesService, PrismaService],
  exports: [CategoriesService, PublicCategoriesService],
})
export class CategoriesModule {}
