/**
 * Supabase Client
 * 인증 및 데이터베이스 연동
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다.');
}

// Reuse the browser client across app imports and development hot reloads.
// Server instances are not cached, so session state is not shared between requests.
const browserGlobal = globalThis as typeof globalThis & { __orderSupabaseClients?: Map<string, SupabaseClient> };
const browserClients = typeof window === 'undefined' ? undefined : (browserGlobal.__orderSupabaseClients ??= new Map());
const clientKey = supabaseUrl + ':' + supabaseAnonKey;
export const supabase: SupabaseClient = browserClients?.get(clientKey) ?? createClient(supabaseUrl, supabaseAnonKey, {
    realtime: { params: { eventsPerSecond: 10 } },
    auth: {
        persistSession: true, // 세션 유지
        autoRefreshToken: true, // 자동 토큰 갱신
        detectSessionInUrl: true, // URL에서 세션 감지 (OAuth 콜백용)
    },
});

if (browserClients) browserClients.set(clientKey, supabase);
