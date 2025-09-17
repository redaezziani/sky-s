// src/barcode/barcode.controller.ts
import { Controller, Get, Query } from '@nestjs/common';
import { BarcodeService } from './barcode.service';

@Controller('barcode')
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  @Get('generate')
  generate(@Query('prefix') prefix?: string) {
    return this.barcodeService.generateSKUWithBarcode(prefix);
  }
}
