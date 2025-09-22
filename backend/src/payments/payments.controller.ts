import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { PaymentService } from './payments.service';
import { ConfirmPaymentDto } from './dto/confirm-payment.dto';

@ApiTags('payments')
@Controller('payments')
export class PaymentController {
  constructor(private paymentService: PaymentService) {}

  @Get('/confirm')
  async confirm(@Query() query: ConfirmPaymentDto) {
    return this.paymentService.confirmPayment(
      query.method,
      query.transactionId,
    );
  }
}
