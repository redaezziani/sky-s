
import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CancelOrderDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;
  @IsString()
  @IsOptional()
  reason?: string;

  @IsString()
  @IsNotEmpty()
  userId: string;
}
