import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const reqHeaders = await headers();
  
  const forwardedFor = reqHeaders.get('x-forwarded-for');
  const realIp = reqHeaders.get('x-real-ip');
  const ip = forwardedFor || realIp || '';
  const userAgent = reqHeaders.get('user-agent') || '';

  const headersObj: Record<string, string> = {
    'user-agent': userAgent,
  };

  // Only forward the IP if it's a real public IP. 
  // If we are on localhost (::1 or 127.0.0.1), we omit it. 
  // This forces the Supabase gateway to pick up the actual public IP 
  // of the machine making the outbound request.
  if (ip && ip !== '::1' && ip !== '127.0.0.1') {
    headersObj['x-forwarded-for'] = ip;
  }

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
      global: {
        headers: headersObj,
      },
    }
  );
}
