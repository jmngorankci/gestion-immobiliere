import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database, Profile } from '@/types/database.types';

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Allow direct navigation in demo / standalone mode
  if (
    !supabaseUrl ||
    !supabaseAnonKey ||
    supabaseAnonKey.includes('placeholder') ||
    supabaseUrl.includes('placeholder')
  ) {
    return supabaseResponse;
  }

  try {
    const supabase = createServerClient<Database>(
      supabaseUrl,
      supabaseAnonKey,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet: Array<{ name: string; value: string; options?: CookieOptions }>) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
            supabaseResponse = NextResponse.next({
              request,
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    // Refresh auth token
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const pathname = request.nextUrl.pathname;

    // Admin routes protection
    if (
      pathname.startsWith('/dashboard') ||
      pathname.startsWith('/encaissements') ||
      pathname.startsWith('/biens') ||
      pathname.startsWith('/travaux') ||
      pathname.startsWith('/reversements')
    ) {
      if (user) {
        // Role check from profile
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const profile = data as unknown as Profile | null;

        if (profile && profile.role !== 'super_admin' && profile.role !== 'gestionnaire') {
          const url = request.nextUrl.clone();
          url.pathname = '/';
          return NextResponse.redirect(url);
        }
      }
    }

    // Tenant portal routes protection
    if (pathname.startsWith('/portal')) {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        const profile = data as unknown as Profile | null;

        if (profile && profile.role !== 'locataire') {
          const url = request.nextUrl.clone();
          url.pathname = '/';
          return NextResponse.redirect(url);
        }
      }
    }
  } catch (e) {
    console.warn('Supabase middleware bypass:', e);
  }

  return supabaseResponse;
}
