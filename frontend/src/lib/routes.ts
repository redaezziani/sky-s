import { UserRole } from "@/types/auth.types";

export const publicRoutes = [
  "/auth/login",
];

export const authenticatedRoutes = ["/dashboard"];

export const roleProtectedRoutes = {
  "/dashboard/users": [UserRole.ADMIN],
  "/dashboard/roles": [UserRole.ADMIN],
  "/dashboard/categories": [UserRole.MODERATOR],
  "/dashboard/products": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/product-variants": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/skus": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/orders": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/order-items": [UserRole.MODERATOR, UserRole.ADMIN],
  "/dashboard/analytics": [UserRole.ADMIN],
  "/dashboard/settings": [UserRole.ADMIN],
};

export const authRoutes = publicRoutes;
