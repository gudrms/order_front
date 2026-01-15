'use client';

import { useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ChevronLeft, Heart, ShoppingCart } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Image from 'next/image';

// TODO: Move to shared types
interface Menu {
    id: string;
    name: string;
    price: number;
    imageUrl?: string;
    description?: string;
    soldOut: boolean;
}

interface Favorite {
    id: string;
    menuId: string;
    menu: Menu;
    createdAt: string;
}

export default function FavoritesPage() {
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const fetchFavorites = async (): Promise<Favorite[]> => {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/users/me/favorites`);
        if (!res.ok) throw new Error('Failed to fetch favorites');
        return res.json();
    };

    const { data: favorites, isLoading } = useQuery({
        queryKey: ['favorites'],
        queryFn: fetchFavorites,
        enabled: !!user,
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

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            <header className="bg-white px-4 h-14 flex items-center border-b border-gray-100 sticky top-0 z-50">
                <button onClick={() => router.back()} className="p-2 -ml-2">
                    <ChevronLeft size={24} />
                </button>
                <h1 className="font-bold text-lg ml-2">찜한 메뉴</h1>
            </header>

            <div className="max-w-[568px] mx-auto p-4 space-y-3">
                {favorites?.length === 0 ? (
                    <div className="text-center py-20 text-gray-400">
                        <Heart size={48} className="mx-auto mb-4 opacity-50" />
                        <p>찜한 메뉴가 없습니다.</p>
                        <button
                            onClick={() => router.push('/')}
                            className="mt-4 px-6 py-2 bg-brand-yellow text-white rounded-xl font-bold"
                        >
                            메뉴 보러가기
                        </button>
                    </div>
                ) : (
                    favorites?.map((fav) => (
                        <div key={fav.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4">
                            <div className="relative w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                                {fav.menu.imageUrl ? (
                                    <Image
                                        src={fav.menu.imageUrl}
                                        alt={fav.menu.name}
                                        fill
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-300">
                                        <span className="text-xs">No Image</span>
                                    </div>
                                )}
                            </div>
                            <div className="flex-1 flex flex-col justify-between">
                                <div>
                                    <div className="flex justify-between items-start">
                                        <h3 className="font-bold text-gray-900">{fav.menu.name}</h3>
                                        <button
                                            onClick={() => removeMutation.mutate(fav.menu.id)}
                                            className="text-red-500 p-1"
                                        >
                                            <Heart size={20} fill="currentColor" />
                                        </button>
                                    </div>
                                    <p className="text-sm text-gray-500 line-clamp-1">{fav.menu.description}</p>
                                </div>
                                <div className="flex justify-between items-center mt-2">
                                    <span className="font-bold">{fav.menu.price.toLocaleString()}원</span>
                                    <button
                                        onClick={() => router.push(`/menu/${fav.menu.id}`)} // TODO: Check actual menu detail route
                                        className="px-3 py-1.5 bg-gray-100 text-sm font-medium rounded-lg hover:bg-gray-200"
                                    >
                                        주문하기
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </main>
    );
}
