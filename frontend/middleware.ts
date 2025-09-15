import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Protect dashboard routes
export function middleware(request: NextRequest) {
  const accessToken = request.cookies.get('access_token');

  // Only protect /dashboard and its subroutes
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!accessToken) {
      // Redirect to login if not authenticated
      return NextResponse.redirect(new URL('/auth/login', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*'],
};
