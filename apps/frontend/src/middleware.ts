import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Middleware for Authentication Guard
 *
 * This middleware runs on the Edge Runtime and intercepts requests BEFORE they reach the page.
 * Benefits:
 * - No page flash/flicker (redirects before React renders)
 * - Better security (server-side check)
 * - Better performance (no need to wait for client-side React)
 *
 * Flow:
 * 1. Check if the route requires authentication
 * 2. Check if user has valid access_token cookie
 * 3. Redirect to /login if unauthorized
 * 4. Allow access if authorized
 */

// Routes that require authentication
const protectedRoutes = [
  '/', // Dashboard
  '/urls', // URL management
  '/api-keys', // API keys
  '/profile', // User profile
  '/analytics', // Analytics
  '/users', // User management (admin only, but we check role on server)
];

// Routes that are public (no authentication required)
const publicRoutes = [
  '/login',
  // '/register',
];

// API routes (skip middleware, let API handle auth)
const apiRoutes = ['/api'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for API routes
  if (apiRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // Get access token from cookie
  const accessToken = request.cookies.get('access_token');
  const hasValidToken = !!accessToken?.value;

  // Check if current route is protected
  const isProtectedRoute = protectedRoutes.some((route) => {
    // Exact match or starts with route (for nested routes)
    return pathname === route || pathname.startsWith(route + '/');
  });

  // Check if current route is public
  const isPublicRoute = publicRoutes.some((route) => {
    return pathname === route || pathname.startsWith(route + '/');
  });

  // ========== Protected Routes Logic ==========
  if (isProtectedRoute) {
    if (!hasValidToken) {
      // No token - redirect to login with return URL
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Has token - allow access
    // Note: The actual JWT validation is still done on the server/backend
    // This middleware only does a quick check to prevent obvious unauthorized access
    return NextResponse.next();
  }

  // ========== Public Routes Logic ==========
  // Allow access to public routes regardless of authentication status
  // Let the page/component decide whether to redirect based on auth state
  // This prevents infinite redirect loops when token validation fails
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ========== Default: Allow access ==========
  return NextResponse.next();
}

// Configure which routes the middleware runs on
export const config = {
  /*
   * Match all request paths except for:
   * - _next/static (static files)
   * - _next/image (image optimization files)
   * - favicon.ico (favicon file)
   * - public folder files (images, etc.)
   */
  matcher: [
    /*
     * Match all paths except those starting with:
     * - api (API routes - handled by backend)
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public files (.svg, .png, .jpg, .jpeg, .gif, .webp)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
