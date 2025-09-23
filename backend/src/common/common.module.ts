// src/common/common.module.ts
import { Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ImageKitService } from './services/imagekit.service';
import { PdfService } from './services/pdf.service';
import { EmailService } from './services/email.service';
import { UploadController } from './controllers/upload.controller';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT),
        // Only add auth if user/pass exist
        ...(process.env.SMTP_USER && process.env.SMTP_PASS
          ? {
              auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
              },
            }
          : {}),
      },
      defaults: {
        from: `"No Reply" <${process.env.SMTP_FROM}>`,
      },
    }),
  ],
  controllers: [UploadController],
  providers: [ImageKitService, PdfService, EmailService],
  exports: [ImageKitService, PdfService, EmailService],
})
export class CommonModule {}
