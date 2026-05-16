import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getFavoriteStores, toggleFavoriteStore } from '@order/shared/api';
import { useAuth } from '@/contexts/AuthContext';

export function useFavoriteStores() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: favorites = [] } = useQuery({
        queryKey: ['favorite-stores', user?.id],
        queryFn: getFavoriteStores,
        enabled: !!user,
        staleTime: 5 * 60 * 1000,
    });

    const favoriteStoreIds = new Set(favorites.map((f) => f.storeId));

    const { mutate: toggle, isPending } = useMutation({
        mutationFn: (storeId: string) => toggleFavoriteStore(storeId),
        onMutate: async (storeId) => {
            await queryClient.cancelQueries({ queryKey: ['favorite-stores', user?.id] });
            const prev = queryClient.getQueryData(['favorite-stores', user?.id]);
            queryClient.setQueryData(['favorite-stores', user?.id], (old: typeof favorites) => {
                const isFav = old.some((f) => f.storeId === storeId);
                return isFav ? old.filter((f) => f.storeId !== storeId) : [...old, { storeId } as any];
            });
            return { prev };
        },
        onError: (_err, _storeId, ctx) => {
            queryClient.setQueryData(['favorite-stores', user?.id], ctx?.prev);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: ['favorite-stores', user?.id] });
        },
    });

    return { favoriteStoreIds, toggle, isPending, isLoggedIn: !!user };
}
