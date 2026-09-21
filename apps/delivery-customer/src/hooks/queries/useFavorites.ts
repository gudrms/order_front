import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface Favorite {
    id: string;
    menuId: string;
    createdAt: string;
}

export function useFavorites() {
    const { user } = useAuth();
    const router = useRouter();
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
            // 훅이라 안내를 띄울 UI가 없다. 결제 버튼과 같이 로그인 화면으로 보낸다.
            router.push('/login');
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
