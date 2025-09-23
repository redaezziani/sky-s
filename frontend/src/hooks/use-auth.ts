

import Cookies from "js-cookie";
import { useState, useEffect, useRef, useCallback } from "react";
import { toast } from "sonner";
import { User, AuthResponse, AuthTokens, UserDevice } from "@/types/auth.types";
import { AuthService } from "@/services/auth.service";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [device, setDevice] = useState<UserDevice | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isSubmittingRef = useRef(false);

  useEffect(() => {
    const initializeAuth = async () => {
      // Get the token from the cookie instead of localStorage
      const accessToken = Cookies.get("auth_token");
      const userData = localStorage.getItem("user_data");
      const deviceData = localStorage.getItem("device_data");

      if (accessToken && userData) {
        try {
          setUser(JSON.parse(userData));
          setDevice(deviceData ? JSON.parse(deviceData) : null);
          setIsAuthenticated(true);
        } catch (error) {
          console.error("Failed to parse auth data:", error);
          clearAuthData();
        }
      }
      setIsLoading(false);
    };
    initializeAuth();
  }, []);

  const login = async (authResponse: AuthResponse) => {
    setUser(authResponse.user);
    setDevice(authResponse.device ?? null);
    setIsAuthenticated(true);
    // Save token to cookie and user data to localStorage
    saveTokens(authResponse.tokens);
    saveUserData(authResponse.user);
    saveDeviceData(authResponse.device ?? null);

    toast.success("Logged in successfully", {
      description: `Welcome back, ${
        authResponse.user.name || authResponse.user.email
      }!`,
    });
  };

  const logout = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    try {
      if (!refreshToken) throw new Error("No refresh token");
      await AuthService.logout(refreshToken);
    } finally {
      // Clear token from cookie and data from localStorage
      clearAuthData();
      setUser(null);
      setDevice(null);
      setIsAuthenticated(false);
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
      setDevice(null);
      setIsAuthenticated(false);
      toast.success("Logged out from all devices", {
        description: "You have been logged out from all devices.",
      });
    }
  };

  const saveTokens = (tokens: AuthTokens) => {
    // Save the access token to a cookie that is readable by the middleware
    Cookies.set("auth_token", tokens.accessToken, { expires: 7, path: "/" });
    localStorage.setItem("refresh_token", tokens.refreshToken);
  };

  const saveUserData = (userData: User) => {
    localStorage.setItem("user_data", JSON.stringify(userData));
  };

  const saveDeviceData = (deviceData: UserDevice | null) => {
    if (deviceData)
      localStorage.setItem("device_data", JSON.stringify(deviceData));
    else localStorage.removeItem("device_data");
  };

  const clearAuthData = () => {
    // Remove the cookie and localStorage data
    Cookies.remove("auth_token");
    localStorage.removeItem("refresh_token");
    localStorage.removeItem("user_data");
    localStorage.removeItem("device_data");
  };

  const getToken = () => Cookies.get("auth_token");

  const refreshTokens = async () => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) throw new Error("No refresh token available");

    try {
      const tokens = await AuthService.refreshTokens(refreshToken);
      saveTokens(tokens);
      return tokens;
    } catch (error) {
      clearAuthData();
      setUser(null);
      setDevice(null);
      setIsAuthenticated(false);
      throw error;
    }
  };

  return {
    user,
    device,
    isAuthenticated,
    isLoading,
    login,
    logout,
    logoutAll,
    getToken,
    refreshTokens,
  };
}
