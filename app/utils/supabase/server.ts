import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";

export const createClient = async (cookieStore: ReturnType<typeof cookies>) => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error('Missing Supabase environment variables');
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll: async () => {
          return (await cookieStore).getAll()
        },
        setAll: async (cookiesToSet) => {
          try {
            for (const { name, value, options } of cookiesToSet) {
              (await cookieStore).set(name, value, options);
            }
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  );

  return supabase;
};
