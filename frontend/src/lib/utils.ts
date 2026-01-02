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
  let value: unknown = translations[locale];

  for (const key of keys) {
    value = (value as Record<string, unknown>)?.[key];
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
  withCredentials: true,
});

const shownErrors = new Set<string>();
const ERROR_TOAST_TIMEOUT = 3000;

instance.interceptors.request.use(
  (config) => config,
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });

  failedQueue = [];
};

instance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 403) {
      const errorMessage = getErrorMessage('permissionDenied');
      const errorKey = '403-permission-denied';

      if (!shownErrors.has(errorKey)) {
        shownErrors.add(errorKey);
        toast.error(errorMessage);

        setTimeout(() => {
          shownErrors.delete(errorKey);
        }, ERROR_TOAST_TIMEOUT);
      }

      return Promise.reject(error);
    }

    if (originalRequest.url?.includes('/auth/refresh')) {
      if (typeof window !== 'undefined') {
        localStorage.clear();
        sessionStorage.clear();
        isRefreshing = false;
        processQueue(error, null);

        const currentPath = window.location.pathname + window.location.search;
        const returnUrl = encodeURIComponent(currentPath);
        window.location.href = `/auth/login?returnUrl=${returnUrl}`;
      }
      return Promise.reject(error);
    }

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/register');
    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !isAuthEndpoint
    ) {
      if (isRefreshing) {
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
        await instance.post('/auth/refresh');
        isRefreshing = false;
        processQueue(null, 'refreshed');

        return instance(originalRequest);
      } catch (refreshError) {
        isRefreshing = false;
        processQueue(refreshError instanceof Error ? refreshError : new Error(String(refreshError)), null);

        if (typeof window !== 'undefined') {
          localStorage.clear();
          sessionStorage.clear();

          const currentPath = window.location.pathname + window.location.search;
          const returnUrl = encodeURIComponent(currentPath);

          window.location.href = `/auth/login?returnUrl=${returnUrl}`;
        }

        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

const fetcher = (url: string) => instance.get(url).then((res) => res.data);

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
