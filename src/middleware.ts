import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

const publicRoutes = ['/', '/sign-in(.*)', '/sign-up(.*)'];
const isPublicRoute = createRouteMatcher(publicRoutes);

const protectedRoutes = ['/(.*)'];
const isProtectedRoute = createRouteMatcher(protectedRoutes);

export default clerkMiddleware((auth, req) => {
    if (!isPublicRoute(req) && isProtectedRoute(req)) {
        // This will protect all routes except the public ones
        auth().protect();
    }
});

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)'],
};