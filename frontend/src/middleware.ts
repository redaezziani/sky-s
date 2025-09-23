// frontend/src/middleware.ts

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { publicRoutes, roleProtectedRoutes } from "./lib/routes";
import { UserRole } from "./types";

// Define the backend API URL
const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8085/api";

// Helper function to validate the token with the backend
const validateAuth = async (req: NextRequest) => {
  const token = req.cookies.get("auth_token")?.value;
  if (!token) return null;

  try {
    const response = await fetch(`${BACKEND_API_URL}/auth/validate`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    return data.user;
  } catch (error) {
    console.error("Token validation failed:", error);
    return null;
  }
};

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const isPublicRoute = publicRoutes.includes(pathname);
  const user = await validateAuth(req);

  // 1. Redirect authenticated users from public routes
  if (user && isPublicRoute) {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  // 2. Redirect unauthenticated users to the login page
  if (!user && !isPublicRoute) {
    return NextResponse.redirect(new URL("/auth/login", req.url));
  }

  // 3. Handle role-based access
  const allowedRoles = (roleProtectedRoutes as Record<string, UserRole[]>)[pathname];

  // If the path is a role-protected route and the user exists
  if (allowedRoles && user) {
    // Check if the user's role is in the list of allowed roles for this path
    if (!allowedRoles.includes(user.role)) {
      // If the user's role is not allowed, redirect them
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }
  }

  // 4. If all checks pass, allow the request to proceed
  return NextResponse.next();
}

// Configuration for which paths the middleware should run on
export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico|.*\\.png$).*)"],
};
