export enum UserRole {
  USER = "USER",
  ADMIN = "ADMIN",
  MODERATOR = "MODERATOR",
}

export interface User {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  isEmailVerified: boolean;
  isActive?: boolean; // optional
  lastLoginAt?: string | null;
}

export interface UserDevice {
  id: string;
  ip: string;
  userAgent: string;
  deviceType: "Desktop" | "Mobile" | "Tablet" | string;
  country: string | null;
  city: string | null;
  lastUsedAt: string;
  isActive?: boolean;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}



export interface AuthResponse {
  user: User;
  tokens: AuthTokens;
  device?: UserDevice; // added
}


export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name?: string;
}

export interface ForgotPasswordRequest {
  email: string;
}

export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
}

export interface VerifyEmailRequest {
  token: string;
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface AuthError {
  message: string;
  error: string;
  statusCode: number;
}

export interface MessageResponse {
  message: string;
}

export interface TokenValidationResponse {
  valid: boolean;
  user: User;
}
