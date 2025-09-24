// src/hooks/use-auth.ts
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, AuthResponse, UserDevice } from "@/types/auth.types";
import { AuthService } from "@/services/auth.service";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [device, setDevice] = useState<UserDevice | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(false); // Set to false initially. The middleware handles the first auth check.

  // The logic to fetch the profile should be separated from the initial render.
  const fetchProfile = async () => {
    setIsLoading(true);
    try {
      const profile = await AuthService.getProfile();
      setUser(profile);
      setIsAuthenticated(true);
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      clearAuthData();
      setUser(null);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };



  const login = async (authResponse: AuthResponse) => {
    setUser(authResponse.user);
    setDevice(authResponse.device ?? null);
    setIsAuthenticated(true);
    saveUserData(authResponse.user);
    saveDeviceData(authResponse.device ?? null);

    toast.success("Logged in successfully", {
      description: `Welcome back, ${
        authResponse.user.name || authResponse.user.email
      }!`,
    });
    // ✅ After successful login, trigger the profile fetch and redirect.
    // We'll let the redirect happen automatically on the successful login response.
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      clearAuthData();
      setUser(null);
      setDevice(null);
      setIsAuthenticated(false);
    }
  };

  const logoutAll = async () => {
    try {
      await AuthService.logoutAll(); // Assumes AuthService.logoutAll() sends POST to /auth/logout-all
    } finally {
      clearAuthData();
      setUser(null);
      setDevice(null);
      setIsAuthenticated(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem("user_data");
    localStorage.removeItem("device_data");
  };

  const saveUserData = (userData: User) => {
    localStorage.setItem("user_data", JSON.stringify(userData));
  };

  const saveDeviceData = (deviceData: UserDevice | null) => {
    if (deviceData)
      localStorage.setItem("device_data", JSON.stringify(deviceData));
    else localStorage.removeItem("device_data");
  };

  return {
    user,
    device,
    isAuthenticated,
    isLoading,
    login,
    logout,
    logoutAll, // Expose logoutAll
    fetchProfile,
  };
}
