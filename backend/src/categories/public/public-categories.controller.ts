import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { PublicCategoriesService } from './public-categories.service';
import { PublicCategoryDto } from '../dto/public-category.dto';

@ApiTags('Public Categories')
@Controller('public/categories')
export class PublicCategoriesController {
  constructor(
    private readonly publicCategoriesService: PublicCategoriesService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get all active categories (public)' })
  @ApiResponse({
    status: 200,
    description: 'List of categories (id, name, slug, description)',
    type: [PublicCategoryDto],
  })
  async findAll(): Promise<PublicCategoryDto[]> {
    return this.publicCategoriesService.findAll();
  }
}
