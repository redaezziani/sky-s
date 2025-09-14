import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, AuthResponse, AuthTokens } from "@/types/auth.types";
import { AuthService } from "@/services/auth.service";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const accessToken = localStorage.getItem("access_token");
      const userData = localStorage.getItem("user_data");
      
      if (accessToken && userData) {
        try {
          const user = JSON.parse(userData);
          setUser(user);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to parse user data:", error);
          clearAuthData();
        }
      }
      
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (authResponse: AuthResponse) => {
    setUser(authResponse.user);
    setIsAuthenticated(true);
    saveTokens(authResponse.tokens);
    saveUserData(authResponse.user);

    toast.success("Logged in successfully", {
      description: `Welcome back, ${authResponse.user.name || authResponse.user.email}!`,
    });
  };

  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem("refresh_token");
      if (refreshToken) {
        await AuthService.logout(refreshToken);
      }
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);

      toast.success("Logged out successfully", {
        description: "You have been logged out of your account.",
      });
    }
  };

  const logoutAll = async () => {
    try {
      await AuthService.logoutAll();
    } catch (error) {
      console.error("Logout all error:", error);
    } finally {
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);

      toast.success("Logged out from all devices", {
        description: "You have been logged out from all devices.",
      });
    }
  };

  const saveTokens = (tokens: AuthTokens) => {
    localStorage.setItem("access_token", tokens.accessToken);
    localStorage.setItem("refresh_token", tokens.refreshToken);
  };

  const saveUserData = (userData: User) => {
    localStorage.setItem("user_data", JSON.stringify(userData));
  };

  const clearAuthData = () => {
    localStorage.removeItem("access_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
  };

  const updateAuthState = async () => {
    try {
      const userProfile = await AuthService.getProfile();
      setUser(userProfile);
      setIsAuthenticated(true);
      saveUserData(userProfile);
    } catch (error) {
      console.error("Failed to update auth state:", error);
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
    }
  };

  const getToken = () => {
    return localStorage.getItem("access_token");
  };

  const refreshTokens = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      throw new Error("No refresh token available");
    }

    try {
      const tokens = await AuthService.refreshTokens(refreshToken);
      saveTokens(tokens);
      return tokens;
    } catch (error) {
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    login,
    logout,
    logoutAll,
    updateAuthState,
    getToken,
    refreshTokens,
  };
}
