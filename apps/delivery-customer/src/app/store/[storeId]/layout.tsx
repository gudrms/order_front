'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getStore } from '@order/shared/api';
import { StoreProvider } from '@/contexts/StoreContext';

export default function StoreLayout({ children }: { children: React.ReactNode }) {
    const { storeId } = useParams<{ storeId: string }>();
    const router = useRouter();

    const { data: store, isLoading } = useQuery({
        queryKey: ['store', storeId],
        queryFn: () => getStore(storeId),
        retry: false,
    });

    useEffect(() => {
        if (!isLoading && !store) router.replace('/');
    }, [isLoading, store, router]);

    if (isLoading) {
        return (
            <main className="min-h-screen bg-white flex items-center justify-center text-gray-500">
                매장 정보를 불러오는 중...
            </main>
        );
    }

    if (!store) return null;

    return <StoreProvider store={store}>{children}</StoreProvider>;
}
