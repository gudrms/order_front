import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true, // 어드민 앱은 로그인 유지 필요
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
  // 주방/POS 알림을 위한 Realtime 설정 추가
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

/**
 * Storage URL 생성 헬퍼
 */
export function getPublicUrl(path: string, bucket = 'assets') {
  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Supabase Realtime 채널 생성 헬퍼
 */
export function createRealtimeChannel(channelName: string) {
  return supabase.channel(channelName);
}
