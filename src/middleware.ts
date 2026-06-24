import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/app/lib/supabase/middleware';

export async function middleware(request: NextRequest) {
  const { user, supabaseResponse } = await updateSession(request);

  const { pathname } = request.nextUrl;

  // Define public routes that don't require authentication
  const isPublicRoute = pathname === '/login' || pathname.startsWith('/public');

  if (!user && !isPublicRoute) {
    // Unauthenticated user trying to access a protected route → redirect to /login
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (user && pathname === '/login') {
    // Authenticated user trying to access /login → redirect to /dashboard
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, etc.)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
