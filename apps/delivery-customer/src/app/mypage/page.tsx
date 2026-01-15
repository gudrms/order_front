'use client';

import { useRouter } from 'next/navigation';
import {
    ChevronRight,
    Receipt,
    MapPin,
    Heart,
    LogOut,
    User as UserIcon,
    Ticket,
    Coins
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

export default function MyPage() {
    const router = useRouter();
    const { user, signOut, loading } = useAuth();

    const handleLogout = async () => {
        try {
            await signOut();
            router.push('/login');
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
            </main>
        );
    }

    if (!user) {
        router.push('/login');
        return null;
    }

    const menuItems = [
        {
            label: '주문 내역',
            icon: Receipt,
            onClick: () => router.push('/orders'),
            color: 'text-blue-500',
            bgColor: 'bg-blue-50'
        },
        {
            label: '주소 관리',
            icon: MapPin,
            onClick: () => router.push('/mypage/address'),
            color: 'text-green-500',
            bgColor: 'bg-green-50'
        },
        {
            label: '찜한 메뉴',
            icon: Heart,
            onClick: () => router.push('/mypage/favorites'),
            color: 'text-red-500',
            bgColor: 'bg-red-50'
        }
    ];

    return (
        <main className="min-h-screen bg-gray-50 pb-24">
            {/* Header */}
            <header className="bg-white px-4 h-14 flex items-center border-b border-gray-100 sticky top-0 z-50">
                <h1 className="font-bold text-lg">마이페이지</h1>
            </header>

            <div className="max-w-[568px] mx-auto">
                {/* User Profile Section */}
                <section className="bg-white p-6 mb-2">
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                            <UserIcon size={32} className="text-gray-400" />
                        </div>
                        <div>
                            <h2 className="font-bold text-xl">
                                {user.user_metadata?.full_name || '고객'}님
                            </h2>
                            <p className="text-gray-500 text-sm mt-1">
                                {user.phone || user.email}
                            </p>
                        </div>
                        <button className="ml-auto p-2 text-gray-400">
                            <ChevronRight size={24} />
                        </button>
                    </div>

                    {/* Dashboard (Points/Coupons) */}
                    <div className="grid grid-cols-2 gap-3 mt-6">
                        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
                                    <Coins size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-600">포인트</span>
                            </div>
                            <span className="font-bold text-lg">0 P</span>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="p-2 bg-purple-100 rounded-lg text-purple-600">
                                    <Ticket size={20} />
                                </div>
                                <span className="text-sm font-medium text-gray-600">쿠폰</span>
                            </div>
                            <span className="font-bold text-lg">0 장</span>
                        </div>
                    </div>
                </section>

                {/* Menu Grid */}
                <section className="bg-white p-4 mb-2">
                    <h3 className="font-bold text-lg mb-4">나의 활동</h3>
                    <div className="grid grid-cols-3 gap-4">
                        {menuItems.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.label}
                                    onClick={item.onClick}
                                    className="flex flex-col items-center gap-2 p-4 rounded-xl hover:bg-gray-50 transition-colors"
                                >
                                    <div className={`w-12 h-12 rounded-full ${item.bgColor} ${item.color} flex items-center justify-center mb-1`}>
                                        <Icon size={24} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">{item.label}</span>
                                </button>
                            );
                        })}
                    </div>
                </section>

                {/* Footer Actions */}
                <section className="bg-white p-4">
                    <button
                        onClick={handleLogout}
                        className="w-full flex items-center justify-between p-4 text-gray-500 hover:bg-gray-50 rounded-xl transition-colors"
                    >
                        <span className="flex items-center gap-3">
                            <LogOut size={20} />
                            로그아웃
                        </span>
                        <ChevronRight size={20} />
                    </button>
                </section>

                <div className="p-6 text-center text-xs text-gray-400">
                    <p>버전 1.0.0</p>
                    <p className="mt-1">고객센터 1234-5678</p>
                </div>
            </div>
        </main>
    );
}
