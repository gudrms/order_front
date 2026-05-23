'use client';

import { QueryClient, QueryClientProvider, QueryCache, type Query } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import PushNotificationHandler from '@/components/PushNotificationHandler';
import { showErrorToast } from '@/lib/capacitor/toast';

// 전역 에러 토스트 가드: 모든 쿼리 에러에 무차별로 띄우면(보조 쿼리·백그라운드 refetch·재시도)
// 탭 전환 등에서 스팸이 된다. ① meta.errorToast로 opt-in한 화면 핵심 쿼리만,
// ② 보여줄 캐시 데이터가 없을 때만(빈 화면 방지가 본래 목적), ③ 짧은 간격 중복은 억제.
let lastErrorToastAt = 0;
function notifyQueryError(query: Query<unknown, unknown>) {
    if (query.meta?.errorToast !== true) return;
    if (query.state.data !== undefined) return;
    const now = Date.now();
    if (now - lastErrorToastAt < 4000) return;
    lastErrorToastAt = now;
    void showErrorToast('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
}

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                // 쿼리 실패(네트워크 단절·서버 점검 등) 시 화이트 스크린 대신
                // 토스트로 안내. 화면 핵심 쿼리만 meta.errorToast로 opt-in한다.
                queryCache: new QueryCache({
                    onError: (_error, query) => notifyQueryError(query),
                }),
                defaultOptions: {
                    queries: {
                        staleTime: 60 * 1000,
                        // 하이브리드 앱 백그라운드→복귀 시 stale 쿼리가 한꺼번에
                        // refetch되는 focus storm 방지. 신선도는 staleTime·Realtime·
                        // 명시적 invalidate로 보장한다.
                        refetchOnWindowFocus: false,
                    },
                },
            })
    );

    return (
        <QueryClientProvider client={queryClient}>
            <AuthProvider>
                {/* AuthProvider 하위에 마운트해야 useAuth() 접근 가능 */}
                <PushNotificationHandler />
                {children}
            </AuthProvider>
        </QueryClientProvider>
    );
}
