import { type NextRequest, NextResponse } from 'next/server';
import { updateSession } from '@/app/lib/supabase/middleware';
import { createClient } from '@supabase/supabase-js';

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

  // Check if authenticated user is inactive (deactivated while logged in)
  if (user && !isPublicRoute) {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { autoRefreshToken: false, persistSession: false } }
    );

    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('status')
      .eq('id', user.id)
      .single();

    if (profile?.status === 'Inactive') {
      // Clear auth cookies and redirect to login with inactive flag
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      url.searchParams.set('inactive', 'true');

      const response = NextResponse.redirect(url);

      // Remove all Supabase auth cookies to force sign-out
      request.cookies.getAll().forEach(({ name }) => {
        if (name.startsWith('sb-')) {
          response.cookies.delete(name);
        }
      });

      return response;
    }
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
