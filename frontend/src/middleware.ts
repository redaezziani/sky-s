import { NextResponse, type NextRequest } from 'next/server';
import {
  publicRoutes,
  authenticatedRoutes,
  roleProtectedRoutes,
} from '@/lib/routes';
import { UserRole } from '@/types/auth.types';

const BACKEND_API_URL = 'http://localhost:8085/api';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const accessToken = request.cookies.get('access_token')?.value;

  let user: { role: UserRole } | null = null;
  let isAuthenticated = false;

  if (accessToken) {
    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/validate`, {
        method: 'GET',
        headers: {
          Cookie: `access_token=${accessToken}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        isAuthenticated = true;
        user = data.user;
      }
    } catch (error) {
      console.error('Backend token validation failed:', error);
      isAuthenticated = false;
    }
  }

  if (request.nextUrl.pathname === '/') {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  if (publicRoutes.includes(pathname)) {
    if (isAuthenticated) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    return NextResponse.next();
  }

  const requiredRoles: UserRole[] | undefined =
    roleProtectedRoutes[pathname as keyof typeof roleProtectedRoutes];

  if (authenticatedRoutes.includes(pathname) || requiredRoles) {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  if (requiredRoles && user) {
    if (!requiredRoles.includes(user.role)) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
