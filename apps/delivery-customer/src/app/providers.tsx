'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import PushNotificationHandler from '@/components/PushNotificationHandler';

export default function Providers({ children }: { children: React.ReactNode }) {
    const [queryClient] = useState(
        () =>
            new QueryClient({
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
