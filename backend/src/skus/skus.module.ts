import { Module } from '@nestjs/common';
import { SkusController } from './skus.controller';
import { SkusService } from './skus.service';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [SkusController],
  providers: [SkusService, PrismaService],
  exports: [SkusService],
})
export class SkusModule {}
