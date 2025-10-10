import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Query,
  Param,
  UseGuards,
  Request,
  ValidationPipe,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { 
  CartItemDto, 
  SyncCartDto, 
  AddToCartDto, 
  UpdateCartItemDto 
} from './dto/cart.dto';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getUserCart(@Request() req): Promise<CartItemDto[]> {
    return this.cartService.getUserCart(req.user.userId);
  }

  @Post('sync')
  async syncCart(
    @Body(new ValidationPipe()) syncCartDto: SyncCartDto,
    @Request() req,
  ): Promise<CartItemDto[]> {
    // Ensure the userId matches the authenticated user
    syncCartDto.userId = req.user.userId;
    return this.cartService.syncCart(syncCartDto);
  }

  @Post('add')
  async addToCart(
    @Body(new ValidationPipe()) addToCartDto: AddToCartDto,
    @Request() req,
  ): Promise<CartItemDto[]> {
    return this.cartService.addToCart(req.user.userId, addToCartDto);
  }

  @Put('update')
  async updateCartItem(
    @Body(new ValidationPipe()) updateCartItemDto: UpdateCartItemDto,
    @Request() req,
  ): Promise<CartItemDto[]> {
    return this.cartService.updateCartItem(req.user.userId, updateCartItemDto);
  }

  @Delete('remove/:skuId')
  async removeFromCart(
    @Param('skuId') skuId: string,
    @Request() req,
  ): Promise<CartItemDto[]> {
    return this.cartService.removeFromCart(req.user.userId, skuId);
  }

  @Delete('clear')
  async clearCart(@Request() req): Promise<void> {
    return this.cartService.clearCart(req.user.userId);
  }

  @Get('count')
  async getCartItemCount(@Request() req): Promise<{ count: number }> {
    const count = await this.cartService.getCartItemCount(req.user.userId);
    return { count };
  }

  @Get('subtotal')
  async getCartSubtotal(@Request() req): Promise<{ subtotal: number }> {
    const subtotal = await this.cartService.getCartSubtotal(req.user.userId);
    return { subtotal };
  }
}

// Public endpoint for guest cart operations (without auth)
@Controller('cart/public')
export class PublicCartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  async getGuestCart(@Query('userId') userId: string): Promise<CartItemDto[]> {
    if (!userId) {
      return [];
    }
    return this.cartService.getUserCart(userId);
  }
}
