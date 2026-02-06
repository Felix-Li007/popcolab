import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server'
import { NextResponse } from 'next/server'

// TODO: This is demo middleware for testing purposes, not intended for production use.
// Define protected routes using glob patterns, regular expressions, or a function
const publicRoutes = createRouteMatcher(['/public/:path*', '/about', '/sign-in/:path*', '/sign-up/:path*']);
const protectedRoutes = createRouteMatcher(['/protected/:path*', '/user-profile']);
const adminRoutes = createRouteMatcher(['/admin/:path*']);

// Middleware to protect routes
export default clerkMiddleware(async (auth, req) => {
    if (protectedRoutes(req)) {
        // Protect the route by ensuring the user is authenticated
        await auth.protect();
    }
    if (adminRoutes(req) && (await auth()).sessionClaims?.role !== 'admin') {
        const targetUrl = new URL("/", req.url);
        return NextResponse.redirect(targetUrl); // Redirect non-admin users to the home page

    }
})

export const config = {
    matcher: [
        // Skip Next.js internals and all static files, unless found in search params
        '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
        // Always run for API routes
        '/(api|trpc)(.*)',
    ],
}