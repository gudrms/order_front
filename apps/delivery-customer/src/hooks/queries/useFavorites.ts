import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { showInfoToast } from '@/lib/capacitor/toast';
import { useAuth } from '@/contexts/AuthContext';

interface Favorite {
    id: string;
    menuId: string;
    createdAt: string;
}

export function useFavorites() {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const fetchFavorites = async (): Promise<Favorite[]> => {
        if (!user) return [];
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/favorites`);
        if (!res.ok) throw new Error('Failed to fetch favorites');
        return res.json();
    };

    const { data: favorites, isLoading } = useQuery({
        queryKey: ['favorites'],
        queryFn: fetchFavorites,
        enabled: !!user,
    });

    const addMutation = useMutation({
        mutationFn: async (menuId: string) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/favorites/${menuId}`, {
                method: 'POST',
            });
            if (!res.ok) throw new Error('Failed to add favorite');
            return res.json();
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });

    const removeMutation = useMutation({
        mutationFn: async (menuId: string) => {
            const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/favorites/${menuId}`, {
                method: 'DELETE',
            });
            if (!res.ok) throw new Error('Failed to remove favorite');
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
        },
    });

    const toggleFavorite = (menuId: string) => {
        if (!user) {
            // 하트 한 번에 화면을 떠나보내지 않는다. 메뉴를 보던 맥락을 유지한 채 안내만 한다.
            void showInfoToast('로그인이 필요한 서비스입니다.');
            return;
        }

        const isFavorited = favorites?.some(f => f.menuId === menuId);
        if (isFavorited) {
            removeMutation.mutate(menuId);
        } else {
            addMutation.mutate(menuId);
        }
    };

    return {
        favorites,
        isLoading,
        toggleFavorite,
        isFavorited: (menuId: string) => favorites?.some(f => f.menuId === menuId) ?? false,
    };
}
