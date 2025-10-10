import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { PrismaService } from '../prisma/prisma.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { secrets } from '../config/secrets';
import { EmailService } from 'src/common/services/email.service';
import { CartService } from '../cart/cart.service';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      secret: secrets.JwtSecret,
      signOptions: { expiresIn: secrets.JwtExpiresIn },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    PrismaService,
    JwtStrategy,
    LocalStrategy,
    EmailService,
    CartService,
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
