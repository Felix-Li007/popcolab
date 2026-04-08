import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import { normalizeRole, readClaimRole } from '@/utils/clerk-helper';

const redirectRoutes = createRouteMatcher([
  process.env.NEXT_PUBLIC_CLERK_SIGN_IN_FORCE_REDIRECT_URL as string,
  process.env.NEXT_PUBLIC_CLERK_SIGN_UP_FORCE_REDIRECT_URL as string,
  process.env.NEXT_PUBLIC_CLERK_ACTION_DASHBOARD_URL as string,
]);

const protectedRoutes = createRouteMatcher([
  '/admin/:path*',
  '/dashboard/:path*',
]);
const adminRoutes = createRouteMatcher(['/admin/:path*']);

export default clerkMiddleware(async (auth, req) => {
  const isProtectedRoute = protectedRoutes(req);
  const isAdminRoute = adminRoutes(req);
  const isRedirectRoute = redirectRoutes(req);
  if (!isProtectedRoute && !isRedirectRoute) {
    return;
  }
  const authState = await auth();
  const userRole = normalizeRole(readClaimRole(authState.sessionClaims));
  const isAdmin = userRole === 'role_admin';
  if (isRedirectRoute && authState.userId) {
    const targetUrl = isAdmin ? '/admin' : '/dashboard';
    if (req.nextUrl.pathname !== targetUrl) {
      return NextResponse.redirect(new URL(targetUrl, req.url));
    }
  }
  if (isProtectedRoute) {
    await auth.protect();
    if ((isAdmin && !isAdminRoute) || (!isAdmin && isAdminRoute)) {
      const targetUrl = new URL('/', req.url);
      return NextResponse.redirect(targetUrl);
    }
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
