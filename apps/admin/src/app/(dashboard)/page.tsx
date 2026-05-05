'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { ShoppingBag, Menu as MenuIcon, Users, TrendingUp } from 'lucide-react';
import { useAdminStore } from '@/contexts/AdminStoreContext';

interface StoreStats {
  todayOrderCount: number;
  todaySales: number;
  pendingOrderCount: number;
  soldOutMenuCount: number;
}

function formatSales(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`;
}

export default function DashboardHome() {
  const { selectedStoreId, authHeaders } = useAdminStore();

  const { data: stats, isLoading } = useQuery<StoreStats>({
    queryKey: ['store-stats-daily', selectedStoreId],
    queryFn: async () => {
      const response = await axios.get(
        `${process.env.NEXT_PUBLIC_API_URL}/stores/${selectedStoreId}/stats/daily`,
        { headers: authHeaders }
      );
      return response.data.data ?? response.data;
    },
    enabled: !!selectedStoreId && !!authHeaders,
    // 1분마다 갱신
    refetchInterval: 60_000,
    refetchIntervalInBackground: false,
  });

  const statCards = [
    {
      name: '오늘 주문',
      value: isLoading ? '...' : (stats ? String(stats.todayOrderCount) : '—'),
      icon: ShoppingBag,
      color: 'text-blue-600',
      bg: 'bg-blue-100',
    },
    {
      name: '오늘 매출',
      value: isLoading ? '...' : (stats ? formatSales(stats.todaySales) : '—'),
      icon: TrendingUp,
      color: 'text-green-600',
      bg: 'bg-green-100',
    },
    {
      name: '처리 중인 주문',
      value: isLoading ? '...' : (stats ? String(stats.pendingOrderCount) : '—'),
      icon: Users,
      color: 'text-orange-600',
      bg: 'bg-orange-100',
    },
    {
      name: '품절 메뉴',
      value: isLoading ? '...' : (stats ? String(stats.soldOutMenuCount) : '—'),
      icon: MenuIcon,
      color: 'text-red-600',
      bg: 'bg-red-100',
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-700">환영합니다, 사장님!</h2>
        <p className="text-gray-500">매장의 실시간 현황을 확인하세요.</p>
      </div>

      {!selectedStoreId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          매장을 선택하면 오늘의 통계를 확인할 수 있습니다.
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className={`text-2xl font-bold ${stat.value === '—' || stat.value === '...' ? 'text-gray-400' : 'text-gray-800'}`}>
                  {stat.value}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* 최근 주문 섹션 (Placeholder) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">최근 주문</h3>
          <div className="space-y-4 text-center py-12">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-400">최근 주문 내역은 <strong>주문 관리</strong> 화면에서 확인하세요.</p>
          </div>
        </div>

        {/* 매장 상태 섹션 (Placeholder) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">매장 상태</h3>
          <div className="space-y-4 text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-400">테이블 현황은 <strong>테이블 관리</strong> 화면에서 확인하세요.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
