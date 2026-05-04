'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { ShoppingBag, Menu as MenuIcon, Users, TrendingUp } from 'lucide-react';

// NOTE: 실 통계 API(오늘 주문/매출/대기/품절)는 후속 작업.
// 임시로 "—" placeholder를 노출해 운영자에게 가짜 숫자를 보이지 않게 함.
const stats = [
  { name: '오늘 주문', value: '—', icon: ShoppingBag, color: 'text-blue-600', bg: 'bg-blue-100' },
  { name: '오늘 매출', value: '—', icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100' },
  { name: '대기 중인 주문', value: '—', icon: Users, color: 'text-orange-600', bg: 'bg-orange-100' },
  { name: '품절 메뉴', value: '—', icon: MenuIcon, color: 'text-red-600', bg: 'bg-red-100' },
];

export default function DashboardHome() {
  const { user } = useAuth();

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-xl font-semibold text-gray-700">환영합니다, 사장님!</h2>
        <p className="text-gray-500">매장의 실시간 현황을 확인하세요.</p>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
        통계 데이터 연동 준비 중입니다. 정확한 일일 집계는 추후 적용됩니다. 현재 운영 정보는 좌측 메뉴의 <strong>주문 관리</strong>에서 실시간으로 확인하세요.
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.name} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
            <div className="flex items-center gap-4">
              <div className={`${stat.bg} p-3 rounded-lg`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">{stat.name}</p>
                <p className="text-2xl font-bold text-gray-400">{stat.value}</p>
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
            <p className="text-gray-400">최근 주문 내역이 없습니다.</p>
          </div>
        </div>

        {/* 매장 상태 섹션 (Placeholder) */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4">매장 상태</h3>
          <div className="space-y-4 text-center py-12">
            <Users className="w-12 h-12 text-gray-300 mx-auto" />
            <p className="text-gray-400">현재 이용 중인 테이블 정보가 없습니다.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
