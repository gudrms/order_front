'use client';

import { QueryClient, QueryClientProvider, QueryCache } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import PushNotificationHandler from '@/components/PushNotificationHandler';
import { showErrorToast } from '@/lib/capacitor/toast';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
                // 쿼리 실패(네트워크 단절·서버 점검 등) 시 화이트 스크린 대신
                // 토스트로 안내. 화면은 각 컴포넌트의 빈 상태로 graceful하게 유지된다.
                queryCache: new QueryCache({
                    onError: () => {
                        void showErrorToast('일시적인 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
                    },
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
