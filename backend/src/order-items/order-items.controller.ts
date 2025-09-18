import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { OrderItemsService } from './order-items.service';
import { CreateOrderItemDto } from './dto/create-order-item.dto';
import { UpdateOrderItemDto } from './dto/update-order-item.dto';
import { QueryOrderItemDto } from './dto/query-order-item.dto';
import { OrderItemResponseDto } from './dto/order-item-response.dto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiTags('Order Items')
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly service: OrderItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order item' })
  @ApiResponse({ status: 201, type: OrderItemResponseDto })
  create(@Body() dto: CreateOrderItemDto) {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all order items with pagination' })
  findAll(@Query() query: QueryOrderItemDto) {
    return this.service.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order item by ID' })
  @ApiResponse({ status: 200, type: OrderItemResponseDto })
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an order item' })
  @ApiResponse({ status: 200, type: OrderItemResponseDto })
  update(@Param('id') id: string, @Body() dto: UpdateOrderItemDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an order item' })
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
