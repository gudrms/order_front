/**
 * Supabase 클라이언트
 * PostgreSQL + Realtime + Storage
 */

import { createClient } from '@supabase/supabase-js';

// 환경변수에서 Supabase URL과 Key 가져오기
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Supabase 클라이언트 생성
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: false, // 테이블 오더는 인증 불필요
  },
  realtime: {
    params: {
      eventsPerSecond: 10, // Realtime 이벤트 전송 제한
    },
  },
});

/**
 * Supabase Realtime 채널 생성 헬퍼
 *
 * @example
 * // 주방 화면에서 신규 주문 알림 구독
 * const channel = createRealtimeChannel('kitchen_orders')
 *   .on('postgres_changes',
 *     { event: 'INSERT', schema: 'public', table: 'orders' },
 *     (payload) => console.log('새 주문:', payload.new)
 *   )
 *   .subscribe()
 */
export function createRealtimeChannel(channelName: string) {
  return supabase.channel(channelName);
}
