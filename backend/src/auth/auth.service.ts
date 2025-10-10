import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { secrets } from '../config/secrets';
import {
  RegisterDto,
  LoginDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  RefreshTokenDto,
} from './dto/auth.dto';
import { JwtPayload, AuthTokens, AuthResponse } from './types/auth.types';
import { User } from '@prisma/client';
import { UserDeviceDto } from './dto/response.dto';

import * as geoip from 'geoip-lite';
import { EmailService } from 'src/common/services/email.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
    private readonly cartService: CartService,
  ) {}

  async register(registerDto: RegisterDto): Promise<AuthResponse> {
    const { email, password, name } = registerDto;

    // Check if user already exists
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      password,
      secrets.BcryptSaltRounds,
    );

    // Generate email verification token
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    // Generate tokens
    const tokens = await this.generateTokens(user);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
    };
  }

  async login(
    loginDto: LoginDto,
    ip: string,
    userAgent: string,
  ): Promise<AuthResponse & { device: UserDeviceDto }> {
    const { email, password } = loginDto;

    // Find user
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || !user.isActive)
      throw new UnauthorizedException('Invalid credentials');

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid)
      throw new UnauthorizedException('Invalid credentials');

    // Update last login
    await this.prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() },
    });

    // Determine device type
    let deviceType = 'Desktop';
    if (/mobile/i.test(userAgent)) deviceType = 'Mobile';
    if (/tablet/i.test(userAgent)) deviceType = 'Tablet';

    // Handle geo lookup safely
    let country: string | null = null;
    let city: string | null = null;

    // For local development, default to a public IP to avoid null geo
    const ipForGeo =
      ip === '::1' || ip === '127.0.0.1' || ip === 'unknown' ? '8.8.8.8' : ip;

    const geo = geoip.lookup(ipForGeo);
    if (geo) {
      country = geo.country || null;
      city = geo.city || null;
    }

    // Upsert device info
    const device = await this.prisma.userDevice.upsert({
      where: { userId_ip: { userId: user.id, ip } },
      create: {
        userId: user.id,
        ip,
        userAgent,
        deviceType,
        country,
        city,
        lastUsedAt: new Date(),
      },
      update: {
        lastUsedAt: new Date(),
        userAgent,
        deviceType,
        country,
        city,
      },
    });

    // Generate tokens linked to device
    const tokens = await this.generateTokens(user, device.id);

    // Get user's cart for sync
    const cartItems = await this.cartService.getUserCart(user.id);
    const cartCount = await this.cartService.getCartItemCount(user.id);
    const cartSubtotal = await this.cartService.getCartSubtotal(user.id);

    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
      },
      tokens,
      cart: {
        items: cartItems,
        totalItems: cartCount,
        subtotal: cartSubtotal,
      },
      device: {
        id: device.id,
        ip: device.ip,
        userAgent: device.userAgent,
        deviceType: device.deviceType,
        country: device.country,
        city: device.city,
        lastUsedAt: device.lastUsedAt,
      },
    };
  }

  async refreshTokens(refreshTokenDto: RefreshTokenDto): Promise<AuthTokens> {
    const { refreshToken } = refreshTokenDto;

    // Verify refresh token
    let payload: JwtPayload;
    try {
      payload = this.jwtService.verify(refreshToken, {
        secret: secrets.JwtRefreshSecret,
      });
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    // Check if refresh token exists in database and is not expired
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { token: refreshToken },
      include: { user: true },
    });

    if (!storedToken || new Date() > storedToken.expiresAt) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    if (!storedToken.user.isActive) {
      throw new UnauthorizedException('User account is inactive');
    }

    // Generate new tokens
    const tokens = await this.generateTokens(storedToken.user);

    // Remove old refresh token
    await this.prisma.refreshToken.delete({
      where: { id: storedToken.id },
    });

    return tokens;
  }

  async logout(refreshToken: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token: refreshToken },
    });
  }

  async logoutAll(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async forgotPassword(forgotPasswordDto: ForgotPasswordDto): Promise<void> {
    const { email } = forgotPasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive) {
      // Don't reveal if user exists or not for security
      return;
    }

    // Generate password reset token
    const resetToken = randomBytes(32).toString('hex');
    const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetToken: resetToken,
        passwordResetExpires: resetExpires,
      },
    });

    // TODO: Send password reset email
    const resetUrl = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
  const html = `
    <p>Hello ${user.name},</p>
    <p>You requested a password reset. Click the link below to reset your password:</p>
    <a href="${resetUrl}">Reset Password</a>
    <p>If you did not request this, please ignore this email.</p>
  `;

  await this.emailService.sendEmail(user.email, 'Password Reset', html);
    console.log(`Password reset token for ${email}: ${resetToken}`);
  }

  async resetPassword(resetPasswordDto: ResetPasswordDto): Promise<void> {
    const { token, newPassword } = resetPasswordDto;

    const user = await this.prisma.user.findFirst({
      where: {
        passwordResetToken: token,
        passwordResetExpires: {
          gt: new Date(),
        },
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(
      newPassword,
      secrets.BcryptSaltRounds,
    );

    // Update user password and clear reset token
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    // Logout from all devices
    await this.logoutAll(user.id);
  }

  async verifyEmail(token: string): Promise<void> {
    const user = await this.prisma.user.findFirst({
      where: {
        emailVerificationToken: token,
        emailVerificationExpires: {
          gt: new Date(),
        },
        isActive: true,
      },
    });

    if (!user) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        isEmailVerified: true,
        emailVerificationToken: null,
        emailVerificationExpires: null,
      },
    });
  }

  async resendEmailVerification(email: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user || !user.isActive || user.isEmailVerified) {
      return; // Don't reveal user information
    }

    // Generate new verification token
    const emailVerificationToken = randomBytes(32).toString('hex');
    const emailVerificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationToken,
        emailVerificationExpires,
      },
    });

    const verifyUrl = `${process.env.FRONTEND_URL}/auth/verify-email?token=${emailVerificationToken}`;
  const html = `
    <p>Hello ${user.name},</p>
    <p>Please verify your email by clicking the link below:</p>
    <a href="${verifyUrl}">Verify Email</a>
  `;

  await this.emailService.sendEmail(user.email, 'Verify Your Email', html);
    console.log(
      `Email verification token for ${email}: ${emailVerificationToken}`,
    );
  }

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (
      user &&
      user.isActive &&
      (await bcrypt.compare(password, user.password))
    ) {
      return user;
    }

    return null;
  }

  async findUserById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { id, isActive: true },
    });
  }

  private async generateTokens(
    user: User,
    deviceId?: string,
  ): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: secrets.JwtSecret,
      expiresIn: secrets.JwtExpiresIn,
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: secrets.JwtRefreshSecret,
      expiresIn: secrets.JwtRefreshExpiresIn,
    });

    const refreshTokenExpires = new Date();
    refreshTokenExpires.setDate(refreshTokenExpires.getDate() + 7); // 7 days

    await this.prisma.refreshToken.create({
      data: {
        token: refreshToken,
        userId: user.id,
        deviceId,
        expiresAt: refreshTokenExpires,
      },
    });

    return { accessToken, refreshToken };
  }

  async getUserDevices(userId: string) {
    return this.prisma.userDevice.findMany({
      where: { userId, isActive: true },
      orderBy: { lastUsedAt: 'desc' },
      select: {
        id: true,
        ip: true,
        userAgent: true,
        deviceType: true,
        country: true,
        city: true,
        lastUsedAt: true,
      },
    });
  }

  async logoutDevice(userId: string, deviceId: string) {
    // Delete refresh tokens linked to that device
    await this.prisma.refreshToken.deleteMany({
      where: { userId, deviceId },
    });

    // Optionally deactivate device
    await this.prisma.userDevice.update({
      where: { id: deviceId },
      data: { isActive: false },
    });
  }
}
