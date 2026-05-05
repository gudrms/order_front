'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';
import { AuthProvider } from '@/contexts/AuthContext';
import { AdminStoreProvider } from '@/contexts/AdminStoreContext';
import { WebPushHandler } from '@/components/WebPushHandler';

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 30_000,
        refetchOnWindowFocus: false,
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        {/* FCM 웹 푸시 초기화 — AuthProvider 내부에서 한 번만 마운트 */}
        <WebPushHandler />
        <AdminStoreProvider>
          {children}
        </AdminStoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}
