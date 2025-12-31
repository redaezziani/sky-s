import axios from 'axios';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { toast } from 'sonner';
import enMessages from '../../messages/en.json';
import arMessages from '../../messages/ar.json';
import esMessages from '../../messages/es.json';
import frMessages from '../../messages/fr.json';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Translation messages
const translations = {
  en: enMessages,
  ar: arMessages,
  es: esMessages,
  fr: frMessages,
} as const;

type Locale = 'en' | 'ar' | 'es' | 'fr';

// Get current locale from cookie
function getCurrentLocale(): Locale {
  if (typeof document === 'undefined') return 'en';
  const cookies = document.cookie.split(';');
  const localeCookie = cookies.find((c) => c.trim().startsWith('NEXT_LOCALE='));
  const locale = localeCookie?.split('=')[1]?.trim() || 'en';
  return (locale in translations ? locale : 'en') as Locale;
}

// Get translated error message
function getErrorMessage(key: 'permissionDenied'): string {
  const locale = getCurrentLocale();
  return translations[locale].errors[key];
}

// Get translated message with parameter replacement
export function getTranslation(
  path: string,
  params?: Record<string, string>,
): string {
  const locale = getCurrentLocale();
  const keys = path.split('.');
  let value: any = translations[locale];

  for (const key of keys) {
    value = value?.[key];
  }

  if (typeof value !== 'string') {
    return path; // Return the path if translation not found
  }

  // Replace parameters like {role}, {permission}
  if (params) {
    return Object.entries(params).reduce((str, [key, val]) => {
      return str.replace(new RegExp(`\\{${key}\\}`, 'g'), val);
    }, value);
  }

  return value;
}

const instance = axios.create({
  baseURL: 'http://localhost:8085/api',
  timeout: 10000,
  withCredentials: true, // ✅ Key change: This tells axios to send cookies.
});

// Track shown error toasts to prevent duplicates
const shownErrors = new Set<string>();
const ERROR_TOAST_TIMEOUT = 3000; // Clear error from set after 3 seconds

// Request interceptor: No changes needed here, as the browser handles the cookies.
instance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
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

    // Handle 403 Forbidden (Insufficient permissions)
    if (error.response?.status === 403) {
      // Use translated error message
      const errorMessage = getErrorMessage('permissionDenied');
      // Use a generic key for all 403 errors to prevent multiple permission toasts
      const errorKey = '403-permission-denied';

      // Only show toast if we haven't shown this error recently
      if (!shownErrors.has(errorKey)) {
        shownErrors.add(errorKey);
        toast.error(errorMessage);

        // Clear from set after timeout
        setTimeout(() => {
          shownErrors.delete(errorKey);
        }, ERROR_TOAST_TIMEOUT);
      }

      return Promise.reject(error);
    }

    // Don't retry if this is the refresh endpoint itself
    if (originalRequest.url?.includes('/auth/refresh')) {
      // Clear any auth-related storage and redirect
      if (typeof window !== 'undefined') {
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

    // Don't redirect to login on auth endpoints (login, register, etc.)
    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register');

    // Handle expired session (401)
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
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
        await instance.post('/auth/refresh');
        isRefreshing = false;
        processQueue(null, 'refreshed');

        // Retry the original request with the new access token cookie.
        return instance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError, null);

        // Clear any auth-related storage
        if (typeof window !== 'undefined') {
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
  },
);

const fetcher = (url: string) => instance.get(url).then((res) => res.data);

/**
 * Format currency to Moroccan Dirham (MAD)
 * @param amount - The amount to format
 * @param locale - Optional locale for formatting (defaults to 'ar-MA' for Moroccan Arabic)
 * @returns Formatted currency string
 */
export const formatCurrency = (
  amount: number,
  locale: string = 'ar-MA',
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: 'MAD',
  }).format(amount);
};

export { instance as axiosInstance, fetcher };
