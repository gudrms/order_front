'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { Info } from 'lucide-react';
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
      </div>

      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-xl p-4 text-sm text-blue-800">
        <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold mb-1">메뉴는 토스 POS에서 관리됩니다.</p>
          <p>
            메뉴 추가·수정·삭제는 토스 POS 기기에서 진행해주세요. 변경 사항은 자동으로 동기화되어 이 페이지에 반영됩니다.
            (이 화면은 동기화 결과 확인 용도입니다.)
          </p>
        </div>
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
            </div>
          </div>
        ))}
        {menus?.length === 0 && (
          <div className="col-span-full text-center py-16 text-gray-500">
            아직 동기화된 메뉴가 없습니다. 토스 POS에서 메뉴를 등록해주세요.
          </div>
        )}
      </div>
    </div>
  );
}
