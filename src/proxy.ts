import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { readClaimRole } from '@/utils/clerk-helper';

const FORCE_REDIRECT_URL = '/dashboard';

const protectedRoutes = createRouteMatcher([
  '/admin/:path*',
  '/dashboard/:path*',
  '/profile/:path*',
]);
const adminRoutes = createRouteMatcher(['/admin/:path*']);

export default clerkMiddleware(async (auth, req) => {
  const isProtectedRoute = protectedRoutes(req);
  const isAdminRoute = adminRoutes(req);
  const isForceRedirectRoute = req.nextUrl.pathname === FORCE_REDIRECT_URL;
  if (!isProtectedRoute) {
    return;
  }
  const authState = await auth();
  const userRole = readClaimRole(authState.sessionClaims);
  const isAdmin = userRole === 'admin';
  await auth.protect();

  if (isForceRedirectRoute && authState.userId) {
    const targetUrl = isAdmin ? '/admin' : '/';
    return NextResponse.redirect(new URL(targetUrl, req.url));
  }
  if (isAdminRoute && !isAdmin) {
    const targetUrl = new URL('/', req.url);
    return NextResponse.redirect(targetUrl);
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};
