import axios from "axios";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const instance = axios.create({
  baseURL: "http://localhost:8085/api",
  timeout: 10000,
  withCredentials: true, // ✅ Key change: This tells axios to send cookies.
});

// Request interceptor: No changes needed here, as the browser handles the cookies.
instance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error)
);

// Track if we're currently refreshing to prevent multiple refresh attempts
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

// Response interceptor
instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Don't retry if this is the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      // Clear any auth-related storage and redirect
      if (typeof window !== "undefined") {
        localStorage.clear();
        sessionStorage.clear();
        isRefreshing = false;
        processQueue(error, null);

        // Redirect to login page
        const currentPath = window.location.pathname + window.location.search;
        const returnUrl = encodeURIComponent(currentPath);
        window.location.href = `/auth/login?returnUrl=${returnUrl}`;
      }
      return Promise.reject(error);
    }

    // Handle expired session (401)
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then(() => {
            return instance(originalRequest);
          })
          .catch((err) => {
            return Promise.reject(err);
          });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // Call the refresh endpoint. The backend will read the refresh_token from the cookie.
        await instance.post("/auth/refresh");
        isRefreshing = false;
        processQueue(null, "refreshed");

        // Retry the original request with the new access token cookie.
        return instance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        // Clear any auth-related storage
        if (typeof window !== "undefined") {
          localStorage.clear();
          sessionStorage.clear();

          // Save current path to return after login
          const currentPath = window.location.pathname + window.location.search;
          const returnUrl = encodeURIComponent(currentPath);

          // Redirect to login page with return URL
          window.location.href = `/auth/login?returnUrl=${returnUrl}`;
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

const fetcher = (url: string) => instance.get(url).then((res) => res.data);

/**
 * Format currency to Moroccan Dirham (MAD)
 * @param amount - The amount to format
 * @param locale - Optional locale for formatting (defaults to 'ar-MA' for Moroccan Arabic)
 * @returns Formatted currency string
 */
export const formatCurrency = (amount: number, locale: string = "ar-MA"): string => {
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency: "MAD",
  }).format(amount);
};

export { instance as axiosInstance, fetcher };
