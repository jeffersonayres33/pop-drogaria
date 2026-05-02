import { createBrowserClient } from '@supabase/ssr'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

// Browser client (for client components)
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Server client (for server components / API routes)
export function createServerSupabase() {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value },
      set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch {} },
      remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
    }
  })
}

// Service role client (bypass RLS — only on server)
export function createAdminSupabase() {
  const cookieStore = cookies()
  return createServerClient(supabaseUrl, supabaseServiceKey, {
    cookies: {
      get(name: string) { return cookieStore.get(name)?.value },
      set(name, value, options) { try { cookieStore.set({ name, value, ...options }) } catch {} },
      remove(name, options) { try { cookieStore.set({ name, value: '', ...options }) } catch {} },
    }
  })
}
