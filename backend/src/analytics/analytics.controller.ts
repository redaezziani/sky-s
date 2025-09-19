import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { ApiTags, ApiOperation, ApiQuery, ApiResponse } from '@nestjs/swagger';
import { AnalyticsQueryDto, AnalyticsCardDto } from './dto/analytics.dto';
import { AnalyticsChartDataDto } from './dto/analytics-chart-response.dto';
import { AnalyticsChartQueryDto } from './dto/analytics-chart.dto';
import { TopProductsDto } from './dto/analytics-top-products.dto';
import { AnalyticsTopProductsQueryDto } from './dto/analytics-top-products-query.dto';
import { TopProductsMetricsDto } from './dto/analytics-top-products-metrics.dto';
import { AnalyticsTopProductsMetricsQueryDto } from './dto/analytics-top-products-metrics-query.dto';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('cards')
  @ApiOperation({ summary: 'Get key analytics cards' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period in days, default 30',
  })
  @ApiResponse({
    status: 200,
    description: 'Analytics cards retrieved successfully',
    type: [AnalyticsCardDto],
  })
  async getCards(
    @Query() query: AnalyticsQueryDto,
  ): Promise<AnalyticsCardDto[]> {
    return this.analyticsService.getAnalyticsCards(query.period || 30);
  }

  @Get('chart')
  @ApiOperation({
    summary: 'Get daily chart data for orders, revenue, and products',
  })
  @ApiResponse({
    status: 200,
    description: 'Chart data retrieved successfully',
    type: [AnalyticsChartDataDto],
  })
  async getChart(
    @Query() query: AnalyticsChartQueryDto,
  ): Promise<AnalyticsChartDataDto[]> {
    return this.analyticsService.getChartData(query.period || 30);
  }

  // New endpoint for top 10 products
  @Get('top-products')
  @ApiOperation({ summary: 'Get top 10 ordered products for a period' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period in days, default 30',
  })
  @ApiResponse({
    status: 200,
    description: 'Top products retrieved successfully',
    type: [TopProductsDto],
  })
  async getTopProducts(
    @Query('period') query?: AnalyticsTopProductsQueryDto,
  ): Promise<TopProductsDto[]> {
    return this.analyticsService.getTopProducts(query?.period || 30);
  }

  @Get('top-products-metrics')
  @ApiOperation({ summary: 'Get top products metrics for charting' })
  @ApiQuery({
    name: 'period',
    required: false,
    description: 'Period in days (default 30)',
  })
  @ApiResponse({
    status: 200,
    description: 'Top products metrics retrieved successfully',
    type: [TopProductsMetricsDto],
  })
  async getTopProductsMetrics(
    @Query() query: AnalyticsTopProductsMetricsQueryDto,
  ): Promise<TopProductsMetricsDto[]> {
    const period = query.period || 30;
    return this.analyticsService.getTopProductsMetrics(period);
  }
}
