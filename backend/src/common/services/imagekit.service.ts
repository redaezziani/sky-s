import { Injectable, BadRequestException } from '@nestjs/common';
const ImageKit = require('imagekit');
import { secrets } from '../../config/secrets';
import { ResponsiveImageUrlsDto } from '../dto/image.dto';

export interface ImageUploadOptions {
  folder?: string;
  fileName?: string;
  tags?: string[];
  transformation?: {
    height?: number;
    width?: number;
    quality?: number;
    format?: string;
  };
}

export interface ImageUploadResult {
  url: string;
  thumbnailUrl: string;
  fileId: string;
  name: string;
  size: number;
  filePath: string;
}

@Injectable()
export class ImageKitService {
  private imagekit: any;

  constructor() {
    if (!secrets.ImageKitPublicKey || !secrets.ImageKitPrivateKey || !secrets.ImageKitUrlEndpoint) {
      console.warn('ImageKit credentials not configured. Image upload will be disabled.');
      return;
    }

    this.imagekit = new ImageKit({
      publicKey: secrets.ImageKitPublicKey,
      privateKey: secrets.ImageKitPrivateKey,
      urlEndpoint: secrets.ImageKitUrlEndpoint,
    });
  }

  async uploadImage(
    file: Express.Multer.File,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    if (!this.imagekit) {
      throw new BadRequestException('ImageKit service not configured');
    }

    if (!file) {
      throw new BadRequestException('No file provided');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only images are allowed.');
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 10MB.');
    }

    try {
      const fileName = options.fileName || `${Date.now()}-${file.originalname}`;
      const folder = options.folder || 'products';
      
      const uploadResponse = await this.imagekit.upload({
        file: file.buffer,
        fileName,
        folder: `/${folder}`,
        tags: options.tags,
        useUniqueFileName: true,
      });

      // Generate thumbnail URL with default transformations
      const thumbnailUrl = this.generateUrl(uploadResponse.filePath, {
        height: 200,
        width: 200,
        quality: 80,
        format: 'webp',
      });

      return {
        url: uploadResponse.url,
        thumbnailUrl,
        fileId: uploadResponse.fileId,
        name: uploadResponse.name,
        size: uploadResponse.size,
        filePath: uploadResponse.filePath,
      };
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw new BadRequestException('Failed to upload image');
    }
  }

  async uploadMultipleImages(
    files: Express.Multer.File[],
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult[]> {
    if (!files || files.length === 0) {
      throw new BadRequestException('No files provided');
    }

    const uploadPromises = files.map(file => this.uploadImage(file, options));
    return Promise.all(uploadPromises);
  }

  generateUrl(filePath: string, transformation?: ImageUploadOptions['transformation']): string {
    if (!this.imagekit) {
      return filePath;
    }

    const transformationArray: Array<{ [key: string]: string }> = [];
    
    if (transformation) {
      if (transformation.height) transformationArray.push({ height: transformation.height.toString() });
      if (transformation.width) transformationArray.push({ width: transformation.width.toString() });
      if (transformation.quality) transformationArray.push({ quality: transformation.quality.toString() });
      if (transformation.format) transformationArray.push({ format: transformation.format });
    }

    return this.imagekit.url({
      path: filePath,
      transformation: transformationArray,
    });
  }

  async deleteImage(fileId: string): Promise<void> {
    if (!this.imagekit) {
      throw new BadRequestException('ImageKit service not configured');
    }

    try {
      await this.imagekit.deleteFile(fileId);
    } catch (error) {
      console.error('ImageKit delete error:', error);
      throw new BadRequestException('Failed to delete image');
    }
  }

  async deleteMultipleImages(fileIds: string[]): Promise<void> {
    if (!fileIds || fileIds.length === 0) {
      return;
    }

    const deletePromises = fileIds.map(fileId => this.deleteImage(fileId));
    await Promise.all(deletePromises);
  }

  // Generate different image sizes for responsive design
  getResponsiveUrls(filePath: string): ResponsiveImageUrlsDto {
    return {
      thumbnail: this.generateUrl(filePath, { width: 150, height: 150, quality: 80, format: 'webp' }),
      small: this.generateUrl(filePath, { width: 300, height: 300, quality: 85, format: 'webp' }),
      medium: this.generateUrl(filePath, { width: 600, height: 600, quality: 90, format: 'webp' }),
      large: this.generateUrl(filePath, { width: 1200, height: 1200, quality: 95, format: 'webp' }),
      original: this.generateUrl(filePath),
    };
  }

  // upload pdf file // url and fileId
  async uploadPdf(
    file: Express.Multer.File,
    options: ImageUploadOptions = {}
  ): Promise<ImageUploadResult> {
    if (!this.imagekit) {
      throw new BadRequestException('ImageKit service not configured');
    }
    
    if (!file) {
      throw new BadRequestException('No file provided');
    }
    // Validate file type
    const allowedTypes = ['application/pdf'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Invalid file type. Only PDF files are allowed.');
    }
    
    // Validate file size (max 20MB)
    const maxSize = 20 * 1024 * 1024; // 20MB
    if (file.size > maxSize) {
      throw new BadRequestException('File size too large. Maximum size is 20MB.');
    }
    try {
      const fileName = options.fileName || `${Date.now()}-${file.originalname}`;
      const folder = options.folder || 'documents';
    
      const uploadResponse = await this.imagekit.upload({
        file: file.buffer,
        fileName,
        folder: `/${folder}`,
        tags: options.tags,
        useUniqueFileName: true,
      });

      return {
        url: uploadResponse.url,
        thumbnailUrl: uploadResponse.url,
        fileId: uploadResponse.fileId,
        name: uploadResponse.name,
        size: uploadResponse.size,
        filePath: uploadResponse.filePath,
        
      };
    } catch (error) {
      console.error('ImageKit upload error:', error);
      throw new BadRequestException('Failed to upload PDF file');
    }
  }
}
