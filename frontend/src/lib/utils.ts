import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { toast } from "sonner";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const instance = axios.create({
  baseURL: "http://192.168.1.1:8085/api",
  timeout: 10000,
  withCredentials: true, // ✅ Key change: This tells axios to send cookies.
});

// Request interceptor: No changes needed here, as the browser handles the cookies.
instance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Handle expired session (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Call the refresh endpoint. The backend will read the refresh_token from the cookie.
        await instance.post("/auth/refresh");

        // Retry the original request with the new access token cookie.
        return instance(originalRequest);
      } catch (refreshError) {
        toast.error("Session expired", {
          description: "Please log in again to continue.",
        });

        // Redirect to login page on refresh failure
        if (typeof window !== "undefined") {
          window.location.href = "/auth/login";
        }
      }
    }

    return Promise.reject(error);
  }
);

const fetcher = (url: string) => instance.get(url).then((res) => res.data);

export { instance as axiosInstance, fetcher };