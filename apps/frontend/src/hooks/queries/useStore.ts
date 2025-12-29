import { useQuery } from '@tanstack/react-query';
import { mockStore } from '@/mocks';
import { USE_MOCK, mockQuery } from '@/lib/mock-config';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export const useStore = (storeType: string, branchId: string) => {
    return useQuery({
        queryKey: ['store', storeType, branchId],
        queryFn: USE_MOCK
            ? () => mockQuery(mockStore)
            : async () => {
                if (!storeType || !branchId) return null;
                const response = await fetch(`${API_URL}/stores/identifier/${storeType}/${branchId}`);
                if (!response.ok) {
                    throw new Error('Store not found');
                }
                return response.json();
            },
        enabled: !!storeType && !!branchId,
    });
};