import { AxiosError } from "axios";
import { axiosInstance } from "@/lib/utils";
import {
  LoginFormData,
} from "@/types/validation.types";
import {
  AuthError,
  AuthResponse,
  AuthTokens,
  MessageResponse,
  TokenValidationResponse,
  User,
} from "@/types/auth.types";

export class AuthService {
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

  static async refreshTokens(): Promise<AuthTokens> {
    try {
      // ✅ No need to pass a token in the body, the cookie is sent automatically.
      const response = await axiosInstance.post<AuthTokens>("/auth/refresh");
      return response.data;
    } catch (error) {
      if (error instanceof AxiosError && error.response?.data) {
        throw error.response.data as AuthError;
      }
      throw new Error("An unexpected error occurred");
    }
  }

  static async logout(): Promise<MessageResponse> {
    try {
      // ✅ No need to pass a token in the body.
      const response = await axiosInstance.post<MessageResponse>("/auth/logout");
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