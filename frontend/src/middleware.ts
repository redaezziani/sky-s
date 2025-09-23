// src/middleware.ts
import { NextResponse, type NextRequest } from 'next/server';
// ✅ Import all route definitions from the external file
import {
  publicRoutes,
  authenticatedRoutes,
  roleProtectedRoutes
} from '@/lib/routes';

const BACKEND_API_URL = "http://localhost:8085/api";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;


  let user = null;
  let isAuthenticated = false;

  // Validate the token with the NestJS backend
  if (accessToken) {
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/validate`, {
        method: "GET",
        headers: {
          'Cookie': `access_token=${accessToken}`
        },
      });


      if (response.ok) {
        const data = await response.json();
        isAuthenticated = true;
        user = data.user; // ✅ Capture the user object from the backend response
      }
    } catch (error) {
      console.error("Backend token validation failed:", error);
      isAuthenticated = false;
    }
  }

  // Handle public routes
  if (publicRoutes.includes(pathname)) {
    if (isAuthenticated) {
      // Authenticated user trying to access a public route, redirect to dashboard.
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Otherwise, allow access to the public page.
    return NextResponse.next();
  }

  // Handle protected and role-based routes
  const requiredRoles = roleProtectedRoutes[pathname as keyof typeof roleProtectedRoutes];

  if (authenticatedRoutes.includes(pathname) || requiredRoles) {
    if (!isAuthenticated) {
      // Unauthenticated user trying to access a protected page, redirect to login.
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  // Handle role-based access for authenticated users
  if (requiredRoles) {
    if (!requiredRoles.includes(user.role)) {
      // Authenticated user lacks the required role, redirect to an unauthorized page.
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // If authenticated and authorized, allow the request to proceed.
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};