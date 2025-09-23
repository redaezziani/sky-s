// frontend/src/lib/routes.ts

import { UserRole } from "@/types/auth.types";

export const publicRoutes = [
  "/auth/login",
  "/auth/register",
  "/auth/forgot-password",
  "/auth/reset-password",
  "/auth/verify-email",
  "/auth/resend-verification",
];

export const authenticatedRoutes = ["/profile", "/dashboard", "/settings"];

// Map routes to an array of allowed roles
export const roleProtectedRoutes = {
  "/dashboard/users": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/roles": [UserRole.ADMIN],
  "/dashboard/categories": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/products": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/product-variants": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/skus": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/orders": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/order-items": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/analytics": [UserRole.ADMIN],
  // Add more as needed
};

// This is not needed anymore
// export const adminRoutes = Object.keys(roleProtectedRoutes);

export const authRoutes = publicRoutes;
