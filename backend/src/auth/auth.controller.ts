import {
  Controller,
  Post,
  Body,
  UseGuards,
  Get,
  HttpCode,
  HttpStatus,
  ValidationPipe,
  Req,
  Param,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiConflictResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  ForgotPasswordDto,
  ResetPasswordDto,
  VerifyEmailDto,
} from './dto/auth.dto';
import {
  AuthResponseDto,
  AuthTokensDto,
  MessageResponseDto,
  TokenValidationResponseDto,
  UserResponseDto,
  UserDeviceDto,
} from './dto/response.dto';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { RequestUser, AuthResponse, AuthTokens } from './types/auth.types';
import { Request } from 'express';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  async register(
    @Body(new ValidationPipe()) registerDto: RegisterDto,
  ): Promise<AuthResponse> {
    return this.authService.register(registerDto);
  }

  @Post('login')
  @UseGuards(LocalAuthGuard)
  @HttpCode(HttpStatus.OK)
  async login(
    @Body(new ValidationPipe()) loginDto: LoginDto,
    @Req() req: Request,
  ): Promise<AuthResponse> {
    const ip =
      req.ip || req.headers['x-forwarded-for']?.toString() || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    return this.authService.login(loginDto, ip, userAgent);
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refreshTokens(
    @Body(new ValidationPipe()) refreshTokenDto: RefreshTokenDto,
  ): Promise<AuthTokens> {
    return this.authService.refreshTokens(refreshTokenDto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @Body('refreshToken') refreshToken: string,
  ): Promise<{ message: string }> {
    await this.authService.logout(refreshToken);
    return { message: 'Logged out successfully' };
  }

  @Post('logout-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutAll(
    @CurrentUser() user: RequestUser,
  ): Promise<{ message: string }> {
    await this.authService.logoutAll(user.id);
    return { message: 'Logged out from all devices successfully' };
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  async forgotPassword(
    @Body(new ValidationPipe()) forgotPasswordDto: ForgotPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.forgotPassword(forgotPasswordDto);
    return {
      message: 'If the email exists, a password reset link has been sent',
    };
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  async resetPassword(
    @Body(new ValidationPipe()) resetPasswordDto: ResetPasswordDto,
  ): Promise<{ message: string }> {
    await this.authService.resetPassword(resetPasswordDto);
    return { message: 'Password reset successfully' };
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  async verifyEmail(
    @Body(new ValidationPipe()) verifyEmailDto: VerifyEmailDto,
  ): Promise<{ message: string }> {
    await this.authService.verifyEmail(verifyEmailDto.token);
    return { message: 'Email verified successfully' };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  async resendEmailVerification(
    @Body('email') email: string,
  ): Promise<{ message: string }> {
    await this.authService.resendEmailVerification(email);
    return {
      message: 'If the email exists, a verification link has been sent',
    };
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  async getProfile(@CurrentUser() user: RequestUser): Promise<RequestUser> {
    return user;
  }

  @Get('validate')
  @UseGuards(JwtAuthGuard)
  async validateToken(
    @CurrentUser() user: RequestUser,
  ): Promise<{ valid: boolean; user: RequestUser }> {
    return { valid: true, user };
  }

  // ===== Device endpoints =====

  @Get('devices')
  @UseGuards(JwtAuthGuard)
  async getUserDevices(
    @CurrentUser() user: RequestUser,
  ): Promise<UserDeviceDto[]> {
    return this.authService.getUserDevices(user.id);
  }

  @Post('logout-device/:deviceId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logoutDevice(
    @CurrentUser() user: RequestUser,
    @Param('deviceId') deviceId: string,
  ): Promise<{ message: string }> {
    await this.authService.logoutDevice(user.id, deviceId);
    return { message: 'Logged out from device successfully' };
  }
}
