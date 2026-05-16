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
