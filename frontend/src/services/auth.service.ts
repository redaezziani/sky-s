import { AxiosError } from "axios";
import { axiosInstance } from "@/lib/utils";
import {
  LoginFormData,
  RegisterFormData,
  ForgotPasswordFormData,
  ResetPasswordFormData,
  VerifyEmailFormData,
  ResendVerificationFormData,
} from "@/types/validation.types";
import {
  AuthError,
  AuthResponse,
  AuthTokens,
  MessageResponse,
  TokenValidationResponse,
  RefreshTokenRequest,
  User,
} from "@/types/auth.types";

export class AuthService {
  static async register(data: RegisterFormData): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        "/auth/register",
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async login(credentials: LoginFormData): Promise<AuthResponse> {
    try {
      const response = await axiosInstance.post<AuthResponse>(
        "/auth/login",
        credentials
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await axiosInstance.post<AuthTokens>(
        "/auth/refresh",
        { refreshToken }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async logout(refreshToken: string): Promise<MessageResponse> {
    try {
      const response = await axiosInstance.post<MessageResponse>(
        "/auth/logout",
        { refreshToken }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async logoutAll(): Promise<MessageResponse> {
    try {
      const response = await axiosInstance.post<MessageResponse>(
        "/auth/logout-all"
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async forgotPassword(data: ForgotPasswordFormData): Promise<MessageResponse> {
    try {
      const response = await axiosInstance.post<MessageResponse>(
        "/auth/forgot-password",
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async resetPassword(data: ResetPasswordFormData): Promise<MessageResponse> {
    try {
      const response = await axiosInstance.post<MessageResponse>(
        "/auth/reset-password",
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async verifyEmail(data: VerifyEmailFormData): Promise<MessageResponse> {
    try {
      const response = await axiosInstance.post<MessageResponse>(
        "/auth/verify-email",
        data
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async resendEmailVerification(data: ResendVerificationFormData): Promise<MessageResponse> {
    try {
      const response = await axiosInstance.post<MessageResponse>(
        "/auth/resend-verification",
        { email: data.email }
      );
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async getProfile(): Promise<User> {
    try {
      const response = await axiosInstance.get<User>("/auth/profile");
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async validateToken(): Promise<TokenValidationResponse> {
    try {
      const response = await axiosInstance.get<TokenValidationResponse>("/auth/validate");
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }
}
