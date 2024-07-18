import {
    clerkMiddleware,
    createRouteMatcher
} from '@clerk/nextjs/server';

const publicRoutes = ['/', '/sign-in(.*)', '/sign-up(.*)'];
const isPublicRoute = createRouteMatcher(publicRoutes);

const protectedRoutes = ['/p/(.*)'];
const isProtectedRoute = createRouteMatcher(protectedRoutes);

export default clerkMiddleware((auth, req) => {
    if (isProtectedRoute(req)) {
        auth().protect();
    }
});

export const config = {
    matcher: ['/((?!.*\\..*|_next).*)', '/', '/(api|trpc)(.*)', '/p/(.*)'],
};