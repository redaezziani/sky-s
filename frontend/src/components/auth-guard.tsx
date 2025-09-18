"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/hooks/use-auth";

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        // Redirect to login and keep track of where user was
        router.push(`/auth/login?redirect=${encodeURIComponent(pathname)}`);
      } else if (!requireAuth && isAuthenticated) {
        // If already logged in and on login/register, send them to dashboard
        router.push("/dashboard");
      }
    }
  }, [isAuthenticated, isLoading, requireAuth, router, pathname]);

  // Show loading while checking authentication
  if (isLoading) {
    return (
      <div className="flex min-h-svh w-full items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-sm text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Don’t render anything while redirecting
  if (requireAuth && !isAuthenticated) return null;
  if (!requireAuth && isAuthenticated) return null;

  return <>{children}</>;
}
