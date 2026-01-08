import { createClient } from '@supabase/supabase-js';

// 환경변수에서 Supabase URL과 Key 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 테이블 오더는 클라이언트 인증 정보 유지 안함
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Supabase Realtime 채널 생성 헬퍼
 */
export function createRealtimeChannel(channelName: string) {
  return supabase.channel(channelName);
}