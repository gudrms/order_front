'use client';

import { FormEvent, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, RefreshCw, Save } from 'lucide-react';
import { useAdminStore } from '@/contexts/AdminStoreContext';
import { getHttpErrorMessage } from '@/lib/httpError';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type BrandMenu = {
  id: string;
  categoryId: string;
  name: string;
  price: number;
  description?: string | null;
  imageUrl?: string | null;
  displayOrder: number;
  isFeatured: boolean;
  isActive: boolean;
};

type BrandMenuCategory = {
  id: string;
  name: string;
  displayOrder: number;
  isActive: boolean;
  menus?: BrandMenu[];
};

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

export default function BrandMenuPage() {
  const queryClient = useQueryClient();
  const { authHeaders } = useAdminStore();
  const [categoryName, setCategoryName] = useState('');
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [menuForm, setMenuForm] = useState({
    categoryId: '',
    name: '',
    price: '',
    description: '',
    imageUrl: '',
    isFeatured: true,
  });

  const categoriesQuery = useQuery<BrandMenuCategory[]>({
    queryKey: ['brand-menu-admin-categories'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/brand-menus/admin/categories`, {
        headers: authHeaders,
      });
      return response.data.data || response.data;
    },
    enabled: !!authHeaders,
  });

  const categories = categoriesQuery.data || [];
  const menus = useMemo(
    () => categories.flatMap((category) => category.menus || []),
    [categories],
  );

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['brand-menu-admin-categories'] });
  };

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/brand-menus/admin/categories`,
        { name: categoryName.trim() },
        { headers: authHeaders },
      );
    },
    onSuccess: () => {
      setCategoryName('');
      setFeedback({ type: 'success', message: '브랜드 메뉴 카테고리를 추가했습니다.' });
      invalidate();
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getHttpErrorMessage(error, '카테고리 추가에 실패했습니다.') });
    },
  });

  const createMenuMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/brand-menus/admin/menus`,
        {
          categoryId: menuForm.categoryId || categories[0]?.id,
          name: menuForm.name.trim(),
          price: Number(menuForm.price),
          description: menuForm.description.trim() || undefined,
          imageUrl: menuForm.imageUrl.trim() || undefined,
          isFeatured: menuForm.isFeatured,
        },
        { headers: authHeaders },
      );
    },
    onSuccess: () => {
      setMenuForm({
        categoryId: categories[0]?.id || '',
        name: '',
        price: '',
        description: '',
        imageUrl: '',
        isFeatured: true,
      });
      setFeedback({ type: 'success', message: '브랜드 메뉴를 추가했습니다.' });
      invalidate();
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getHttpErrorMessage(error, '브랜드 메뉴 추가에 실패했습니다.') });
    },
  });

  const toggleMenuMutation = useMutation({
    mutationFn: async (menu: BrandMenu) => {
      await axios.patch(
        `${API_URL}/brand-menus/admin/menus/${menu.id}`,
        { isActive: !menu.isActive },
        { headers: authHeaders },
      );
    },
    onSuccess: invalidate,
    onError: (error) => {
      setFeedback({ type: 'error', message: getHttpErrorMessage(error, '메뉴 노출 상태 변경에 실패했습니다.') });
    },
  });

  const handleCreateCategory = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    createCategoryMutation.mutate();
  };

  const handleCreateMenu = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!menuForm.name.trim() || !menuForm.price || categories.length === 0) return;
    createMenuMutation.mutate();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">브랜드 메뉴</h1>
          <p className="mt-1 text-sm text-gray-500">
            홈페이지에 노출되는 대표 메뉴입니다. 매장별 주문 메뉴와 별도로 관리됩니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => categoriesQuery.refetch()}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-6">
          <form onSubmit={handleCreateCategory} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">카테고리 추가</h2>
            <input
              value={categoryName}
              onChange={(event) => setCategoryName(event.target.value)}
              placeholder="예: 타코"
              className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
            />
            <button
              type="submit"
              disabled={createCategoryMutation.isPending}
              className="mt-3 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              추가
            </button>
          </form>

          <form onSubmit={handleCreateMenu} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h2 className="mb-4 text-lg font-semibold text-gray-900">메뉴 추가</h2>
            <div className="space-y-3">
              <select
                value={menuForm.categoryId || categories[0]?.id || ''}
                onChange={(event) => setMenuForm((prev) => ({ ...prev, categoryId: event.target.value }))}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
              <input
                value={menuForm.name}
                onChange={(event) => setMenuForm((prev) => ({ ...prev, name: event.target.value }))}
                placeholder="메뉴명"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
              <input
                value={menuForm.price}
                onChange={(event) => setMenuForm((prev) => ({ ...prev, price: event.target.value }))}
                placeholder="가격"
                inputMode="numeric"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
              <input
                value={menuForm.imageUrl}
                onChange={(event) => setMenuForm((prev) => ({ ...prev, imageUrl: event.target.value }))}
                placeholder="이미지 URL"
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
              <textarea
                value={menuForm.description}
                onChange={(event) => setMenuForm((prev) => ({ ...prev, description: event.target.value }))}
                placeholder="설명"
                rows={3}
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
              />
              <label className="flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={menuForm.isFeatured}
                  onChange={(event) => setMenuForm((prev) => ({ ...prev, isFeatured: event.target.checked }))}
                  className="h-4 w-4 rounded border-gray-300"
                />
                홈 대표 메뉴에 노출
              </label>
            </div>
            <button
              type="submit"
              disabled={createMenuMutation.isPending || categories.length === 0}
              className="mt-4 inline-flex w-full items-center justify-center rounded-md bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              <Save className="mr-2 h-4 w-4" />
              저장
            </button>
          </form>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 px-5 py-4">
            <h2 className="text-lg font-semibold text-gray-900">등록된 브랜드 메뉴</h2>
          </div>
          <div className="divide-y divide-gray-100">
            {categoriesQuery.isLoading && (
              <p className="px-5 py-8 text-center text-sm text-gray-500">불러오는 중입니다.</p>
            )}
            {!categoriesQuery.isLoading && menus.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-500">등록된 브랜드 메뉴가 없습니다.</p>
            )}
            {menus.map((menu) => (
              <div key={menu.id} className="flex flex-col gap-3 px-5 py-4 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold text-gray-900">{menu.name}</h3>
                    {menu.isFeatured && (
                      <span className="rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">대표</span>
                    )}
                    {!menu.isActive && (
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">숨김</span>
                    )}
                  </div>
                  <p className="mt-1 text-sm text-gray-500">
                    {menu.price.toLocaleString()}원
                    {menu.description ? ` · ${menu.description}` : ''}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => toggleMenuMutation.mutate(menu)}
                  className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                >
                  {menu.isActive ? '숨기기' : '노출하기'}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
