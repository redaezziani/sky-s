import { Module } from '@nestjs/common';
import { ImageKitService } from './services/imagekit.service';
import { UploadController } from './controllers/upload.controller';

@Module({
  controllers: [UploadController],
  providers: [ImageKitService],
  exports: [ImageKitService],
})
export class CommonModule {}
