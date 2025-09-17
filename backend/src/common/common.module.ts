import { Module } from '@nestjs/common';
import { ImageKitService } from './services/imagekit.service';
import { UploadController } from './controllers/upload.controller';
import { PdfService } from './services/pdf.service';

@Module({
  controllers: [UploadController],
  providers: [ImageKitService, PdfService],
  exports: [ImageKitService, PdfService],
})
export class CommonModule {}
