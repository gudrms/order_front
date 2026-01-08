'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { Menu, formatCurrency } from '@order/shared'; // 공통 모듈 사용

export default function MenuListPage() {
  const storeId = 'store-1'; // 임시
  const { data: menus, isLoading, error } = useQuery<Menu[]>({
    queryKey: ['menus', storeId],
    queryFn: async () => {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_URL}/stores/${storeId}/menus`);
      return response.data.data || response.data;
    },
  });

  if (isLoading) return <div>로딩 중...</div>;
  if (error) return <div>에러가 발생했습니다.</div>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-800">메뉴 관리</h2>
        <Link
          href="/menu/new"
          className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4" />새 메뉴 추가
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {menus?.map((menu) => (
          <div key={menu.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            <div className="aspect-video bg-gray-100 relative">
              {menu.imageUrl ? (
                <img
                  src={menu.imageUrl}
                  alt={menu.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  이미지 없음
                </div>
              )}
              {menu.soldOut && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <span className="text-white font-bold text-lg border-2 border-white px-4 py-1 rounded">
                    SOLD OUT
                  </span>
                </div>
              )}
            </div>
            
            <div className="p-4 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <div>
                  <span className="text-xs text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-full mb-2 inline-block">
                    {menu.categoryName || '카테고리 없음'}
                  </span>
                  <h3 className="text-lg font-bold text-gray-800">{menu.name}</h3>
                </div>
                <span className="text-lg font-semibold text-gray-900">
                  {formatCurrency(menu.price)}
                </span>
              </div>
              
              <p className="text-gray-500 text-sm mb-4 line-clamp-2 flex-1">
                {menu.description}
              </p>

              <div className="flex gap-2 pt-4 border-t border-gray-50">
                <Link
                  href={`/menu/${menu.id}/edit`}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors text-sm font-medium"
                >
                  <Edit className="w-4 h-4" /> 수정
                </Link>
                <button className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border border-red-100 text-red-600 hover:bg-red-50 transition-colors text-sm font-medium">
                  <Trash2 className="w-4 h-4" /> 삭제
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
