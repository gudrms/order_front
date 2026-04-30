'use client';

import React, { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import {
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  EyeOff,
  Info,
  Minus,
  Plus,
  RefreshCw,
  Save,
  Settings,
  Trash2,
  X,
} from 'lucide-react';
import { formatCurrency, type Menu, type MenuCategory } from '@order/shared';
import { useAdminStore } from '@/contexts/AdminStoreContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type MenuOption = {
  id: string;
  name: string;
  price: number;
  displayOrder: number;
  isSoldOut: boolean;
  tossOptionCode?: string | null;
};

type OptionGroup = {
  id: string;
  name: string;
  minSelect: number;
  maxSelect: number;
  displayOrder: number;
  options: MenuOption[];
};

type MenuWithCategory = Menu & {
  category?: { id: string; name: string };
  optionGroups?: OptionGroup[];
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
  const [expandedOptionMenuId, setExpandedOptionMenuId] = useState<string | null>(null);

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
              ? '직접 등록 메뉴는 수정, 품절, 숨김, 옵션 그룹 관리가 가능합니다. Toss 연동 메뉴는 Toss POS에서 수정해야 합니다.'
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
          const catName = menu.category?.name || menu.categoryName || '카테고리 없음';
          const canEditThisMenu = isAdminDirect && !menu.tossMenuCode;
          const isEditing = editingMenuId === menu.id;
          const isOptionExpanded = expandedOptionMenuId === menu.id;

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
                          {catName}
                        </span>
                        <h3 className="text-lg font-bold text-gray-800">{menu.name}</h3>
                      </div>
                      <span className="whitespace-nowrap text-lg font-semibold text-gray-900">
                        {formatCurrency(menu.price)}
                      </span>
                    </div>
                    <p className="line-clamp-2 flex-1 text-sm text-gray-500">{menu.description}</p>

                    {(menu.optionGroups?.length ?? 0) > 0 && (
                      <p className="mt-2 text-xs text-gray-400">
                        옵션 그룹 {menu.optionGroups!.length}개
                      </p>
                    )}

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
                        <button
                          onClick={() => setExpandedOptionMenuId(isOptionExpanded ? null : menu.id)}
                          className="inline-flex items-center gap-1 rounded-md border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50"
                        >
                          <Settings className="h-3.5 w-3.5" />
                          옵션
                          {isOptionExpanded ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {canEditThisMenu && isOptionExpanded && (
                <OptionGroupPanel
                  storeId={selectedStoreId!}
                  menuId={menu.id}
                  optionGroups={menu.optionGroups || []}
                  authHeaders={authHeaders}
                  onMutated={invalidateMenus}
                />
              )}
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

function OptionGroupPanel({
  storeId,
  menuId,
  optionGroups,
  authHeaders,
  onMutated,
}: {
  storeId: string;
  menuId: string;
  optionGroups: OptionGroup[];
  authHeaders: { Authorization: string } | undefined;
  onMutated: () => void;
}) {
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMin, setNewGroupMin] = useState('0');
  const [newGroupMax, setNewGroupMax] = useState('1');
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editGroupForm, setEditGroupForm] = useState({ name: '', minSelect: '0', maxSelect: '1' });

  const createGroupMutation = useMutation({
    mutationFn: () =>
      axios.post(
        `${API_URL}/stores/${storeId}/menus/${menuId}/option-groups`,
        { name: newGroupName.trim(), minSelect: Number(newGroupMin), maxSelect: Number(newGroupMax) },
        { headers: authHeaders }
      ),
    onSuccess: () => {
      setNewGroupName('');
      setNewGroupMin('0');
      setNewGroupMax('1');
      onMutated();
    },
  });

  const updateGroupMutation = useMutation({
    mutationFn: ({ groupId, data }: { groupId: string; data: object }) =>
      axios.patch(
        `${API_URL}/stores/${storeId}/menus/${menuId}/option-groups/${groupId}`,
        data,
        { headers: authHeaders }
      ),
    onSuccess: () => {
      setEditingGroupId(null);
      onMutated();
    },
  });

  const deleteGroupMutation = useMutation({
    mutationFn: (groupId: string) =>
      axios.delete(
        `${API_URL}/stores/${storeId}/menus/${menuId}/option-groups/${groupId}`,
        { headers: authHeaders }
      ),
    onSuccess: onMutated,
  });

  const createOptionMutation = useMutation({
    mutationFn: ({ groupId, name, price }: { groupId: string; name: string; price: number }) =>
      axios.post(
        `${API_URL}/stores/${storeId}/menus/${menuId}/option-groups/${groupId}/options`,
        { name, price },
        { headers: authHeaders }
      ),
    onSuccess: onMutated,
  });

  const updateOptionMutation = useMutation({
    mutationFn: ({ groupId, optionId, data }: { groupId: string; optionId: string; data: object }) =>
      axios.patch(
        `${API_URL}/stores/${storeId}/menus/${menuId}/option-groups/${groupId}/options/${optionId}`,
        data,
        { headers: authHeaders }
      ),
    onSuccess: onMutated,
  });

  const deleteOptionMutation = useMutation({
    mutationFn: ({ groupId, optionId }: { groupId: string; optionId: string }) =>
      axios.delete(
        `${API_URL}/stores/${storeId}/menus/${menuId}/option-groups/${groupId}/options/${optionId}`,
        { headers: authHeaders }
      ),
    onSuccess: onMutated,
  });

  const startEditGroup = (group: OptionGroup) => {
    setEditingGroupId(group.id);
    setEditGroupForm({ name: group.name, minSelect: String(group.minSelect), maxSelect: String(group.maxSelect) });
  };

  return (
    <div className="border-t border-gray-100 bg-gray-50 p-4 space-y-4">
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">옵션 그룹 관리</p>

      {optionGroups.map((group) => (
        <div key={group.id} className="rounded-lg border border-gray-200 bg-white p-3 space-y-3">
          {editingGroupId === group.id ? (
            <div className="flex flex-col gap-2">
              <input
                value={editGroupForm.name}
                onChange={(e) => setEditGroupForm((p) => ({ ...p, name: e.target.value }))}
                className="rounded border border-gray-300 px-2 py-1 text-sm"
                placeholder="그룹명"
              />
              <div className="flex gap-2 text-xs">
                <label className="flex items-center gap-1">
                  최소
                  <input
                    type="number"
                    min={0}
                    value={editGroupForm.minSelect}
                    onChange={(e) => setEditGroupForm((p) => ({ ...p, minSelect: e.target.value }))}
                    className="w-14 rounded border border-gray-300 px-2 py-1"
                  />
                </label>
                <label className="flex items-center gap-1">
                  최대
                  <input
                    type="number"
                    min={1}
                    value={editGroupForm.maxSelect}
                    onChange={(e) => setEditGroupForm((p) => ({ ...p, maxSelect: e.target.value }))}
                    className="w-14 rounded border border-gray-300 px-2 py-1"
                  />
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => updateGroupMutation.mutate({
                    groupId: group.id,
                    data: {
                      name: editGroupForm.name.trim(),
                      minSelect: Number(editGroupForm.minSelect),
                      maxSelect: Number(editGroupForm.maxSelect),
                    },
                  })}
                  disabled={!editGroupForm.name.trim() || updateGroupMutation.isPending}
                  className="flex-1 rounded bg-blue-600 py-1 text-xs font-semibold text-white disabled:opacity-50"
                >
                  저장
                </button>
                <button
                  onClick={() => setEditingGroupId(null)}
                  className="rounded border border-gray-300 px-3 py-1 text-xs text-gray-600"
                >
                  취소
                </button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-sm font-semibold text-gray-800">{group.name}</span>
                <span className="ml-2 text-xs text-gray-400">
                  {group.minSelect === 0 ? '선택' : '필수'} · 최대 {group.maxSelect}개
                </span>
              </div>
              <div className="flex gap-1">
                <button
                  onClick={() => startEditGroup(group)}
                  className="rounded p-1 text-gray-400 hover:text-gray-700"
                  title="그룹 수정"
                >
                  <Edit3 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => deleteGroupMutation.mutate(group.id)}
                  disabled={deleteGroupMutation.isPending}
                  className="rounded p-1 text-gray-400 hover:text-red-500 disabled:opacity-40"
                  title="그룹 삭제"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {group.options.map((option) => (
              <OptionRow
                key={option.id}
                option={option}
                onUpdate={(data) => updateOptionMutation.mutate({ groupId: group.id, optionId: option.id, data })}
                onDelete={() => deleteOptionMutation.mutate({ groupId: group.id, optionId: option.id })}
                isPending={updateOptionMutation.isPending || deleteOptionMutation.isPending}
              />
            ))}
          </div>

          <AddOptionRow
            onAdd={(name, price) => createOptionMutation.mutate({ groupId: group.id, name, price })}
            isPending={createOptionMutation.isPending}
          />
        </div>
      ))}

      <div className="rounded-lg border border-dashed border-gray-300 p-3 space-y-2">
        <p className="text-xs font-semibold text-gray-500">새 옵션 그룹 추가</p>
        <input
          value={newGroupName}
          onChange={(e) => setNewGroupName(e.target.value)}
          className="w-full rounded border border-gray-300 px-2 py-1.5 text-sm"
          placeholder="그룹명 (예: 맵기 선택)"
        />
        <div className="flex gap-2 text-xs">
          <label className="flex items-center gap-1">
            최소
            <input
              type="number"
              min={0}
              value={newGroupMin}
              onChange={(e) => setNewGroupMin(e.target.value)}
              className="w-14 rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <label className="flex items-center gap-1">
            최대
            <input
              type="number"
              min={1}
              value={newGroupMax}
              onChange={(e) => setNewGroupMax(e.target.value)}
              className="w-14 rounded border border-gray-300 px-2 py-1"
            />
          </label>
          <span className="ml-auto flex items-center text-gray-400">
            {Number(newGroupMin) === 0 ? '(선택)' : '(필수)'}
          </span>
        </div>
        <button
          onClick={() => createGroupMutation.mutate()}
          disabled={!newGroupName.trim() || createGroupMutation.isPending}
          className="inline-flex w-full items-center justify-center gap-1 rounded bg-gray-900 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          <Plus className="h-3.5 w-3.5" />
          그룹 추가
        </button>
      </div>
    </div>
  );
}

function OptionRow({
  option,
  onUpdate,
  onDelete,
  isPending,
}: {
  option: MenuOption;
  onUpdate: (data: object) => void;
  onDelete: () => void;
  isPending: boolean;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(option.name);
  const [price, setPrice] = useState(String(option.price));

  const save = () => {
    onUpdate({ name: name.trim(), price: Number(price) });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="min-w-0 flex-1 rounded border border-gray-300 px-2 py-1 text-xs"
          placeholder="옵션명"
        />
        <input
          value={price}
          onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
          className="w-20 rounded border border-gray-300 px-2 py-1 text-xs"
          placeholder="가격"
        />
        <button onClick={save} disabled={!name.trim()} className="rounded bg-blue-600 p-1 text-white disabled:opacity-50">
          <Save className="h-3.5 w-3.5" />
        </button>
        <button onClick={() => setIsEditing(false)} className="rounded border border-gray-300 p-1 text-gray-500">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    );
  }

  return (
    <div className={`flex items-center justify-between rounded px-2 py-1 text-xs ${option.isSoldOut ? 'opacity-50' : ''}`}>
      <span className="text-gray-700">{option.name}</span>
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{option.price > 0 ? `+${formatCurrency(option.price)}` : '무료'}</span>
        <button
          onClick={() => onUpdate({ isSoldOut: !option.isSoldOut })}
          disabled={isPending}
          className={`rounded px-1.5 py-0.5 text-xs font-medium ${option.isSoldOut ? 'bg-gray-200 text-gray-600' : 'bg-amber-100 text-amber-700'}`}
        >
          {option.isSoldOut ? '해제' : '품절'}
        </button>
        <button onClick={() => setIsEditing(true)} className="text-gray-400 hover:text-gray-700">
          <Edit3 className="h-3 w-3" />
        </button>
        <button onClick={onDelete} disabled={isPending} className="text-gray-400 hover:text-red-500 disabled:opacity-40">
          <Minus className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function AddOptionRow({
  onAdd,
  isPending,
}: {
  onAdd: (name: string, price: number) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [price, setPrice] = useState('0');

  const submit = () => {
    if (!name.trim()) return;
    onAdd(name.trim(), Number(price));
    setName('');
    setPrice('0');
  };

  return (
    <div className="flex items-center gap-1 border-t border-gray-100 pt-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="min-w-0 flex-1 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs placeholder-gray-400"
        placeholder="옵션명"
      />
      <input
        value={price}
        onChange={(e) => setPrice(e.target.value.replace(/[^0-9]/g, ''))}
        onKeyDown={(e) => e.key === 'Enter' && submit()}
        className="w-20 rounded border border-gray-200 bg-gray-50 px-2 py-1 text-xs placeholder-gray-400"
        placeholder="추가가격"
      />
      <button
        onClick={submit}
        disabled={!name.trim() || isPending}
        className="rounded bg-gray-800 p-1 text-white disabled:opacity-50"
      >
        <Plus className="h-3.5 w-3.5" />
      </button>
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
