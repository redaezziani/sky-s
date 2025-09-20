import { UserRole } from '.../../../prisma/generated/prisma';

export interface JwtPayload {
  sub: string; // user id
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    role: UserRole;
    isEmailVerified: boolean;
  };
  tokens: AuthTokens;
}

export interface RequestUser {
  id: string;
  email: string;
  role: UserRole;
}
