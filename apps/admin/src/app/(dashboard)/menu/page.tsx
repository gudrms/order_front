'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Edit3, Eye, EyeOff, Info, Plus, RefreshCw, Save, X } from 'lucide-react';
import { formatCurrency, type Menu, type MenuCategory } from '@order/shared';
import { useAdminStore } from '@/contexts/AdminStoreContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type MenuWithCategory = Menu & {
  category?: { id: string; name: string };
};

export default function MenuListPage() {
  const queryClient = useQueryClient();
  const { selectedStore, selectedStoreId, isLoading: isStoreLoading, authHeaders } = useAdminStore();
  const [categoryName, setCategoryName] = useState('');
  const [editingMenuId, setEditingMenuId] = useState<string | null>(null);
  const [menuForm, setMenuForm] = useState({
    categoryId: '',
    name: '',
    price: '',
    description: '',
    imageUrl: '',
  });
  const [editForm, setEditForm] = useState({
    categoryId: '',
    name: '',
    price: '',
    description: '',
    imageUrl: '',
  });

  const isAdminDirect = selectedStore?.menuManagementMode === 'ADMIN_DIRECT';

  const categoriesQuery = useQuery<MenuCategory[]>({
    queryKey: ['admin-categories', selectedStoreId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/stores/${selectedStoreId}/categories`);
      return response.data.data || response.data;
    },
    enabled: !!selectedStoreId,
  });

  const menusQuery = useQuery<MenuWithCategory[]>({
    queryKey: ['admin-menus', selectedStoreId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/stores/${selectedStoreId}/admin/menus`, {
        headers: authHeaders,
      });
      return response.data.data || response.data;
    },
    enabled: !!selectedStoreId && !!authHeaders,
  });

  const categories = categoriesQuery.data || [];
  const menus = menusQuery.data || [];

  const defaultCategoryId = useMemo(
    () => menuForm.categoryId || categories[0]?.id || '',
    [categories, menuForm.categoryId]
  );

  const invalidateMenus = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-menus', selectedStoreId] });
    queryClient.invalidateQueries({ queryKey: ['menus', selectedStoreId] });
  };

  const createCategoryMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/stores/${selectedStoreId}/categories`,
        { name: categoryName.trim() },
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      setCategoryName('');
      queryClient.invalidateQueries({ queryKey: ['admin-categories', selectedStoreId] });
    },
  });

  const createMenuMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/stores/${selectedStoreId}/menus`,
        {
          categoryId: defaultCategoryId,
          name: menuForm.name.trim(),
          price: Number(menuForm.price),
          description: menuForm.description.trim() || undefined,
          imageUrl: menuForm.imageUrl.trim() || undefined,
        },
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      setMenuForm({ categoryId: '', name: '', price: '', description: '', imageUrl: '' });
      invalidateMenus();
    },
  });

  const updateMenuMutation = useMutation({
    mutationFn: async ({
      menuId,
      data,
    }: {
      menuId: string;
      data: Partial<{
        categoryId: string;
        name: string;
        price: number;
        description: string | null;
        imageUrl: string | null;
        soldOut: boolean;
        isHidden: boolean;
      }>;
    }) => {
      await axios.patch(
        `${API_URL}/stores/${selectedStoreId}/menus/${menuId}`,
        data,
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      setEditingMenuId(null);
      invalidateMenus();
    },
  });

  const syncTossMenuMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/stores/${selectedStoreId}/integrations/toss/sync-menu`,
        undefined,
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-categories', selectedStoreId] });
      invalidateMenus();
    },
  });

  if (isStoreLoading || menusQuery.isLoading) {
    return <div className="py-12 text-center text-gray-500">메뉴를 불러오는 중입니다.</div>;
  }

  if (!selectedStoreId || !selectedStore) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-gray-800">연결된 매장이 없습니다</h2>
        <p className="mt-2 text-sm text-gray-500">먼저 매장 등록 또는 초대코드 가입을 완료해 주세요.</p>
      </div>
    );
  }

  const canCreateMenu = isAdminDirect && defaultCategoryId && menuForm.name.trim() && Number(menuForm.price) >= 0;

  const startEdit = (menu: MenuWithCategory) => {
    setEditingMenuId(menu.id);
    setEditForm({
      categoryId: menu.categoryId,
      name: menu.name,
      price: String(menu.price),
      description: menu.description || '',
      imageUrl: menu.imageUrl || '',
    });
  };

  const submitEdit = (menuId: string) => {
    updateMenuMutation.mutate({
      menuId,
      data: {
        categoryId: editForm.categoryId,
        name: editForm.name.trim(),
        price: Number(editForm.price),
        description: editForm.description.trim() || null,
        imageUrl: editForm.imageUrl.trim() || null,
      },
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">메뉴 관리</h2>
          <p className="mt-1 text-sm text-gray-500">
            {selectedStore.name} · {isAdminDirect ? '관리자 직접 등록 모드' : 'Toss POS 연동 모드'}
          </p>
        </div>
        {!isAdminDirect && (
          <button
            onClick={() => syncTossMenuMutation.mutate()}
            disabled={syncTossMenuMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
          >
            <RefreshCw className={`h-4 w-4 ${syncTossMenuMutation.isPending ? 'animate-spin' : ''}`} />
            Toss 메뉴 동기화
          </button>
        )}
      </div>

      <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
        <Info className="mt-0.5 h-5 w-5 flex-shrink-0" />
        <div>
          <p className="font-semibold">
            {isAdminDirect ? '관리자 화면에서 메뉴를 직접 등록합니다.' : '메뉴는 Toss POS에서 관리됩니다.'}
          </p>
          <p className="mt-1">
            {isAdminDirect
              ? '직접 등록 메뉴는 수정, 품절, 숨김 처리가 가능합니다. Toss 연동 메뉴는 Toss POS에서 수정해야 합니다.'
              : 'Toss POS 메뉴를 동기화해서 고객 주문 화면에 노출합니다. 직접 등록은 매장 관리에서 운영 모드를 변경하세요.'}
          </p>
        </div>
      </div>

      {isAdminDirect && (
        <div className="grid gap-4 lg:grid-cols-[360px_1fr]">
          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-800">카테고리 추가</h3>
            <div className="flex gap-2">
              <input
                value={categoryName}
                onChange={(event) => setCategoryName(event.target.value)}
                className="min-w-0 flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="예: 메인 메뉴"
              />
              <button
                onClick={() => createCategoryMutation.mutate()}
                disabled={!categoryName.trim() || createCategoryMutation.isPending}
                className="rounded-lg bg-gray-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                추가
              </button>
            </div>
          </section>

          <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
            <h3 className="mb-4 font-bold text-gray-800">메뉴 추가</h3>
            <div className="grid gap-3 md:grid-cols-2">
              <CategorySelect
                categories={categories}
                value={defaultCategoryId}
                onChange={(categoryId) => setMenuForm((prev) => ({ ...prev, categoryId }))}
              />
              <TextInput value={menuForm.name} onChange={(name) => setMenuForm((prev) => ({ ...prev, name }))} placeholder="메뉴명" />
              <TextInput value={menuForm.price} onChange={(price) => setMenuForm((prev) => ({ ...prev, price }))} placeholder="가격" numeric />
              <TextInput value={menuForm.imageUrl} onChange={(imageUrl) => setMenuForm((prev) => ({ ...prev, imageUrl }))} placeholder="이미지 URL" />
              <textarea
                value={menuForm.description}
                onChange={(event) => setMenuForm((prev) => ({ ...prev, description: event.target.value }))}
                className="min-h-20 rounded-lg border border-gray-300 px-3 py-2 text-sm md:col-span-2"
                placeholder="메뉴 설명"
              />
              <button
                onClick={() => createMenuMutation.mutate()}
                disabled={!canCreateMenu || createMenuMutation.isPending}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 md:col-span-2"
              >
                <Plus className="h-4 w-4" />
                메뉴 추가
              </button>
            </div>
          </section>
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {menus.map((menu) => {
          const categoryName = menu.category?.name || menu.categoryName || '카테고리 없음';
          const canEditThisMenu = isAdminDirect && !menu.tossMenuCode;
          const isEditing = editingMenuId === menu.id;

          return (
            <div key={menu.id} className={`flex flex-col overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm ${menu.isHidden ? 'opacity-70' : ''}`}>
              <div className="relative aspect-video bg-gray-100">
                {menu.imageUrl ? (
                  <img src={menu.imageUrl} alt={menu.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">이미지 없음</div>
                )}
                {menu.soldOut && (
                  <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                    <span className="rounded border-2 border-white px-4 py-1 text-lg font-bold text-white">SOLD OUT</span>
                  </div>
                )}
                {menu.isHidden && (
                  <span className="absolute left-3 top-3 rounded-full bg-gray-900 px-3 py-1 text-xs font-bold text-white">
                    숨김
                  </span>
                )}
              </div>

              <div className="flex flex-1 flex-col p-4">
                {isEditing ? (
                  <div className="space-y-3">
                    <CategorySelect categories={categories} value={editForm.categoryId} onChange={(categoryId) => setEditForm((prev) => ({ ...prev, categoryId }))} />
                    <TextInput value={editForm.name} onChange={(name) => setEditForm((prev) => ({ ...prev, name }))} placeholder="메뉴명" />
                    <TextInput value={editForm.price} onChange={(price) => setEditForm((prev) => ({ ...prev, price }))} placeholder="가격" numeric />
                    <TextInput value={editForm.imageUrl} onChange={(imageUrl) => setEditForm((prev) => ({ ...prev, imageUrl }))} placeholder="이미지 URL" />
                    <textarea
                      value={editForm.description}
                      onChange={(event) => setEditForm((prev) => ({ ...prev, description: event.target.value }))}
                      className="min-h-20 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      placeholder="메뉴 설명"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => submitEdit(menu.id)}
                        disabled={!editForm.name.trim() || updateMenuMutation.isPending}
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
                      >
                        <Save className="h-4 w-4" />
                        저장
                      </button>
                      <button
                        onClick={() => setEditingMenuId(null)}
                        className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-2 flex justify-between gap-3">
                      <div>
                        <span className="mb-2 inline-block rounded-full bg-blue-50 px-2 py-1 text-xs font-semibold text-blue-600">
                          {categoryName}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800">{menu.name}</h3>
                      </div>
                      <span className="whitespace-nowrap text-lg font-semibold text-gray-900">
                        {formatCurrency(menu.price)}
                      </span>
                    </div>
                    <p className="line-clamp-2 flex-1 text-sm text-gray-500">{menu.description}</p>
                    {canEditThisMenu && (
                      <div className="mt-4 flex flex-wrap gap-2">
                        <button
                          onClick={() => startEdit(menu)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Edit3 className="h-3.5 w-3.5" />
                          수정
                        </button>
                        <button
                          onClick={() => updateMenuMutation.mutate({ menuId: menu.id, data: { soldOut: !menu.soldOut } })}
                          className="rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {menu.soldOut ? '품절 해제' : '품절'}
                        </button>
                        <button
                          onClick={() => updateMenuMutation.mutate({ menuId: menu.id, data: { isHidden: !menu.isHidden } })}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          {menu.isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                          {menu.isHidden ? '노출' : '숨김'}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          );
        })}

        {menus.length === 0 && (
          <div className="col-span-full rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
            {isAdminDirect ? '등록된 메뉴가 없습니다. 카테고리와 메뉴를 추가하세요.' : '아직 동기화된 메뉴가 없습니다. Toss POS 메뉴 동기화를 실행하세요.'}
          </div>
        )}
      </div>
    </div>
  );
}

function CategorySelect({
  categories,
  value,
  onChange,
}: {
  categories: MenuCategory[];
  value: string;
  onChange: (categoryId: string) => void;
}) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
    >
      {categories.length === 0 ? (
        <option value="">카테고리를 먼저 추가하세요</option>
      ) : categories.map((category) => (
        <option key={category.id} value={category.id}>{category.name}</option>
      ))}
    </select>
  );
}

function TextInput({
  value,
  onChange,
  placeholder,
  numeric = false,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  numeric?: boolean;
}) {
  return (
    <input
      value={value}
      onChange={(event) => onChange(numeric ? event.target.value.replace(/[^0-9]/g, '') : event.target.value)}
      className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
      placeholder={placeholder}
    />
  );
}
