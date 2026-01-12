import { useQuery } from '@tanstack/react-query';
import { mockStore } from '@/mocks';
import { USE_MOCK, mockQuery } from '@/lib/mock-config';
import { DOMAINS } from '@/lib/constants/domains';

const API_URL = DOMAINS.API;

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