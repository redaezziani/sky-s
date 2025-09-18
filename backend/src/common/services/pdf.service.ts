import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import { ImageKitService } from './imagekit.service';
import { createCanvas } from 'canvas';
import * as JsBarcode from 'jsbarcode';

@Injectable()
export class PdfService {
  constructor(private readonly imageKitService: ImageKitService) {}

  private generateBarcodeBase64(sku: string): string {
    const canvas = createCanvas(300, 100);
    JsBarcode(canvas, sku, {
      format: 'CODE128',
      width: 2,
      height: 60,
      displayValue: true,
    });
    return canvas.toDataURL('image/png');
  }

  private formatAddress(address: any): string[] {
    if (!address) return ['Address not provided'];

    // Handle both string and JSON address formats
    if (typeof address === 'string') {
      if (address === 'n/a' || address.trim() === '')
        return ['Address not provided'];
      return [address];
    }

    // Handle JSON address object
    if (typeof address === 'object') {
      const lines: string[] = [];

      if (address.street) lines.push(address.street);
      if (address.street2) lines.push(address.street2);

      // City, State, ZIP on one line
      const cityStateZip = [address.city, address.state, address.zipCode]
        .filter(Boolean)
        .join(', ');
      if (cityStateZip) lines.push(cityStateZip);

      if (address.country) lines.push(address.country);

      return lines.length > 0 ? lines : ['Address not provided'];
    }

    return ['Address not provided'];
  }

  private safe(value: any, defaultValue: string = 'N/A'): string {
    if (value === null || value === undefined || value === '') {
      return defaultValue;
    }
    return String(value).toLowerCase() === 'n/a' ? defaultValue : String(value);
  }

  // Helper to truncate text if too long for a column
  private truncateText(
    doc: PDFKit.PDFDocument,
    text: string,
    maxWidth: number,
  ): string {
    let truncated = text;
    while (doc.widthOfString(truncated) > maxWidth && truncated.length > 0) {
      truncated = truncated.slice(0, -1);
    }
    if (truncated.length < text.length) {
      truncated = truncated.slice(0, -3) + '...';
    }
    return truncated;
  }

  // url and fileId
  async generateOrderPdf(order: any): Promise<{url: string, fileId: string}> {
    const doc = new PDFDocument({
      size: 'A4',
      margin: 50,
      bufferPages: true,
    });

    const chunks: Uint8Array[] = [];
    doc.on('data', (chunk) => chunks.push(chunk));
    const pdfBufferPromise = new Promise<Buffer>((resolve) =>
      doc.on('end', () => resolve(Buffer.concat(chunks))),
    );

    const pageWidth = doc.page.width - 100; // Account for margins
    let currentY = 80;

    // Company Header
    doc.fontSize(10).fillColor('#666666').text('Sky-S', 50, 50);
    doc.text('City Center, Tangier Morocco', 50, 65);
    doc.text('+212 612345678', 50, 80);

    currentY = 160;

    // Order Details Section
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333');
    doc.text('ORDER DETAILS', 50, currentY);
    currentY += 20;

    doc.fontSize(10).font('Helvetica').fillColor('#000000');
    doc.text(
      `Order Date: ${new Date(order.createdAt).toLocaleDateString()}`,
      50,
      currentY,
    );
    doc.text(`Status: ${this.safe(order.status)}`, 300, currentY);
    currentY += 15;
    doc.text(`Payment Status: ${this.safe(order.paymentStatus)}`, 50, currentY);
    if (order.trackingNumber) {
      doc.text(`Tracking: ${this.safe(order.trackingNumber)}`, 300, currentY);
    }
    currentY += 30;

    // Customer Information Section
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333');
    doc.text('CUSTOMER INFORMATION', 50, currentY);
    currentY += 20;

    doc.fontSize(10).font('Helvetica').fillColor('#000000');

    // Shipping Address Box
    doc.rect(50, currentY, pageWidth / 2 - 10, 80).stroke();
    doc
      .fontSize(10)
      .font('Helvetica-Bold')
      .text('SHIPPING ADDRESS', 60, currentY + 10);
    doc.fontSize(9).font('Helvetica');

    let shippingY = currentY + 25;
    doc.text(`${this.safe(order.shippingName)}`, 60, shippingY);
    shippingY += 12;

    if (order.shippingEmail && order.shippingEmail !== 'n/a') {
      doc.text(`${this.safe(order.shippingEmail)}`, 60, shippingY);
      shippingY += 12;
    }

    if (order.shippingPhone && order.shippingPhone !== 'n/a') {
      doc.text(`${this.safe(order.shippingPhone)}`, 60, shippingY);
      shippingY += 12;
    }

    // Format and display shipping address
    const shippingAddressLines = this.formatAddress(order.shippingAddress);
    shippingAddressLines.forEach((line) => {
      if (shippingY < currentY + 75) {
        // Don't overflow the box
        doc.text(line, 60, shippingY);
        shippingY += 10;
      }
    });

    // Billing Address Box (if different)
    const shouldShowBillingAddress =
      order.billingAddress &&
      JSON.stringify(order.billingAddress) !==
        JSON.stringify(order.shippingAddress);

    if (shouldShowBillingAddress) {
      doc.rect(pageWidth / 2 + 50, currentY, pageWidth / 2 - 10, 80).stroke();
      doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text('BILLING ADDRESS', pageWidth / 2 + 60, currentY + 10);
      doc.fontSize(9).font('Helvetica');

      let billingY = currentY + 25;
      doc.text(`${this.safe(order.billingName)}`, pageWidth / 2 + 60, billingY);
      billingY += 12;

      if (order.billingEmail && order.billingEmail !== 'n/a') {
        doc.text(
          `${this.safe(order.billingEmail)}`,
          pageWidth / 2 + 60,
          billingY,
        );
        billingY += 12;
      }

      // Format and display billing address
      const billingAddressLines = this.formatAddress(order.billingAddress);
      billingAddressLines.forEach((line) => {
        if (billingY < currentY + 75) {
          doc.text(line, pageWidth / 2 + 60, billingY);
          billingY += 10;
        }
      });
    }

    currentY += 100;

    // Items Section
    doc.fontSize(12).font('Helvetica-Bold').fillColor('#333333');
    doc.text('ORDER ITEMS', 50, currentY);
    currentY += 25;

    // Table Header with better spacing
    const tableStartY = currentY;
    const tableHeaders = [
      { text: 'SKU', x: 50, width: 80 },
      { text: 'Product', x: 140, width: 180 },
      { text: 'Qty', x: 330, width: 40 },
      { text: 'Unit Price', x: 380, width: 70 },
      { text: 'Total', x: 460, width: 80 },
    ];

    // Header background
    doc.rect(50, currentY - 5, pageWidth, 20).fill('#f5f5f5');
    doc.fillColor('#000000');

    // Header text
    doc.fontSize(9).font('Helvetica-Bold');
    tableHeaders.forEach((header) => {
      const align = ['Qty', 'Unit Price', 'Total'].includes(header.text)
        ? 'right'
        : 'left';
      doc.text(header.text, header.x, currentY + 2, {
        width: header.width,
        align: align,
      });
    });

    currentY += 25;

    // Table border
    doc.rect(50, tableStartY - 5, pageWidth, 20).stroke();
    doc
      .moveTo(50, currentY - 5)
      .lineTo(50 + pageWidth, currentY - 5)
      .stroke();

    // Items
    doc.fontSize(8).font('Helvetica');
    // Items
    order.items.forEach((item, index) => {
      const rowY = currentY;
      const rowHeight = 20;

      // Alternate row background
      if (index % 2 === 1) {
        doc.rect(50, rowY - 2, pageWidth, rowHeight).fill('#fafafa');
        doc.fillColor('#000000');
      }

      // Truncate SKU and Product names
      const skuText = this.truncateText(doc, this.safe(item.skuCode), 80);
      const productText = this.truncateText(doc, this.safe(item.name), 180);

      doc.text(skuText, 50, rowY + 3, { width: 80 });
      doc.text(productText, 140, rowY + 3, { width: 180 });
      doc.text(this.safe(item.quantity), 330, rowY + 3, {
        width: 40,
        align: 'right',
      });
      doc.text(
        `$${this.safe(item.unitPrice?.toFixed?.(2) ?? '0.00')}`,
        380,
        rowY + 3,
        { width: 70, align: 'right' },
      );
      doc.text(
        `$${this.safe(item.totalPrice?.toFixed?.(2) ?? '0.00')}`,
        460,
        rowY + 3,
        { width: 80, align: 'right' },
      );

      currentY += rowHeight;
    });

    // Table bottom border
    doc
      .moveTo(50, currentY)
      .lineTo(50 + pageWidth, currentY)
      .stroke();
    currentY += 20;

    // Order Summary
    const summaryStartX = pageWidth - 150;
    const summaryItems = [
      {
        label: 'Subtotal:',
        value: `$${this.safe(order.subtotal?.toFixed?.(2) ?? '0.00')}`,
      },
      {
        label: 'Tax:',
        value: `$${this.safe(order.taxAmount?.toFixed?.(2) ?? '0.00')}`,
      },
      {
        label: 'Shipping:',
        value: `$${this.safe(order.shippingAmount?.toFixed?.(2) ?? '0.00')}`,
      },
      {
        label: 'Discount:',
        value: `-$${this.safe(order.discountAmount?.toFixed?.(2) ?? '0.00')}`,
      },
    ];

    doc.fontSize(9).font('Helvetica');
    summaryItems.forEach((item) => {
      doc.text(item.label, summaryStartX, currentY, { width: 80 });
      doc.text(item.value, summaryStartX + 80, currentY, {
        width: 70,
        align: 'right',
      });
      currentY += 15;
    });

    // Total with background
    doc.rect(summaryStartX - 5, currentY - 2, 160, 18).fill('#e8e8e8');
    doc.fillColor('#000000');
    doc.fontSize(11).font('Helvetica-Bold');
    doc.text('TOTAL:', summaryStartX, currentY + 2, { width: 80 });
    doc.text(
      `$${this.safe(order.totalAmount?.toFixed?.(2) ?? '0.00')}`,
      summaryStartX + 80,
      currentY + 2,
      {
        width: 70,
        align: 'right',
      },
    );
    currentY += 40;

    // Notes section
    if (order.notes && order.notes !== 'n/a') {
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#333333');
      doc.text('NOTES', 50, currentY);
      currentY += 15;
      doc.fontSize(9).font('Helvetica').fillColor('#000000');
      doc.text(order.notes, 50, currentY, { width: pageWidth });
      currentY += 30;
    }

    // Barcode
    try {
      const barcodeBase64 = this.generateBarcodeBase64(
        this.safe(order.orderNumber),
      );
      const barcodeBuffer = Buffer.from(barcodeBase64.split(',')[1], 'base64');
      doc.image(barcodeBuffer, doc.page.width / 2 - 100, currentY, {
        width: 200,
        height: 50,
      });
    } catch (error) {
      console.error('Error generating barcode:', error);
    }

    doc.end();
    const pdfBuffer = await pdfBufferPromise;

    const uploaded = await this.imageKitService.uploadPdf(
      {
        buffer: pdfBuffer,
        originalname: `${this.safe(order.orderNumber)}.pdf`,
        mimetype: 'application/pdf',
      } as Express.Multer.File,
      { folder: 'orders' },
    );
    const url = uploaded.url;
    const fileId = uploaded.fileId;
    return { url, fileId}
  }
}
