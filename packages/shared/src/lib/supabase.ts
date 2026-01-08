/**
 * Supabase Client
 * 인증 및 데이터베이스 연동
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn('Supabase 환경 변수가 설정되지 않았습니다.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        persistSession: true, // 세션 유지
        autoRefreshToken: true, // 자동 토큰 갱신
        detectSessionInUrl: true, // URL에서 세션 감지 (OAuth 콜백용)
    },
});
