'use client';

import { useEffect, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, Save, Ticket } from 'lucide-react';
import type { MenuManagementMode } from '@order/shared';
import { useAdminStore } from '@/contexts/AdminStoreContext';
import { useAuth } from '@/contexts/AuthContext';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

export default function StoreSettingsPage() {
  const { stores, selectedStore, selectedStoreId, setSelectedStoreId, isLoading, authHeaders, refetchStores } = useAdminStore();
  const { profile } = useAuth();
  const isAdmin = profile?.role === 'ADMIN';
  const [form, setForm] = useState({
    name: '',
    branchName: '',
    phoneNumber: '',
    address: '',
    isDeliveryEnabled: false,
    minimumOrderAmount: '0',
    deliveryFee: '0',
    freeDeliveryThreshold: '',
    estimatedDeliveryMinutes: '',
    menuManagementMode: 'TOSS_POS' as MenuManagementMode,
  });

  useEffect(() => {
    if (!selectedStore) return;
    setForm({
      name: selectedStore.name || '',
      branchName: selectedStore.branchName || '',
      phoneNumber: selectedStore.phoneNumber || '',
      address: selectedStore.address || '',
      isDeliveryEnabled: selectedStore.isDeliveryEnabled,
      minimumOrderAmount: String(selectedStore.minimumOrderAmount ?? 0),
      deliveryFee: String(selectedStore.deliveryFee ?? 0),
      freeDeliveryThreshold: selectedStore.freeDeliveryThreshold == null ? '' : String(selectedStore.freeDeliveryThreshold),
      estimatedDeliveryMinutes: selectedStore.estimatedDeliveryMinutes == null ? '' : String(selectedStore.estimatedDeliveryMinutes),
      menuManagementMode: selectedStore.menuManagementMode,
    });
  }, [selectedStore]);

  const updateStoreMutation = useMutation({
    mutationFn: async () => {
      await axios.patch(
        `${API_URL}/stores/${selectedStoreId}`,
        {
          name: form.name.trim(),
          branchName: form.branchName.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          address: form.address.trim() || undefined,
          isDeliveryEnabled: form.isDeliveryEnabled,
          minimumOrderAmount: Number(form.minimumOrderAmount || 0),
          deliveryFee: Number(form.deliveryFee || 0),
          freeDeliveryThreshold: form.freeDeliveryThreshold === '' ? null : Number(form.freeDeliveryThreshold),
          estimatedDeliveryMinutes: form.estimatedDeliveryMinutes === '' ? null : Number(form.estimatedDeliveryMinutes),
          menuManagementMode: form.menuManagementMode,
        },
        { headers: authHeaders }
      );
    },
    onSuccess: async () => {
      await refetchStores();
    },
  });

  const refreshInviteMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/stores/${selectedStoreId}/invite-code`,
        undefined,
        { headers: authHeaders }
      );
    },
    onSuccess: async () => {
      await refetchStores();
    },
  });

  if (isLoading) {
    return <div className="py-12 text-center text-gray-500">매장 정보를 불러오는 중입니다.</div>;
  }

  if (!selectedStore) {
    return isAdmin ? (
      <CreateStoreSection authHeaders={authHeaders} onCreated={refetchStores} />
    ) : (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-gray-800">연결된 매장이 없습니다</h2>
        <p className="mt-2 text-sm text-gray-500">관리자에게 매장 생성을 요청하거나 초대코드로 가입해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">매장 관리</h2>
        <p className="mt-1 text-sm text-gray-500">매장 기본 정보, 배달 운영, 메뉴 관리 방식을 설정합니다.</p>
      </div>

      {stores.length > 1 && (
        <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
          <label className="mb-2 block text-sm font-semibold text-gray-700">관리 매장</label>
          <select
            value={selectedStoreId || ''}
            onChange={(event) => setSelectedStoreId(event.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {stores.map((store) => (
              <option key={store.id} value={store.id}>
                {store.name} {store.branchName ? `· ${store.branchName}` : ''}
              </option>
            ))}
          </select>
        </section>
      )}

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="mb-4 flex items-center justify-between gap-3">
          <h3 className="font-bold text-gray-800">기본 정보</h3>
          <span className="rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
            {selectedStore.storeType}/{selectedStore.branchId}
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <Field label="매장명" value={form.name} onChange={(value) => setForm((prev) => ({ ...prev, name: value }))} />
          <Field label="지점명" value={form.branchName} onChange={(value) => setForm((prev) => ({ ...prev, branchName: value }))} />
          <Field label="전화번호" value={form.phoneNumber} onChange={(value) => setForm((prev) => ({ ...prev, phoneNumber: value }))} />
          <Field label="주소" value={form.address} onChange={(value) => setForm((prev) => ({ ...prev, address: value }))} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-gray-800">배달 운영</h3>
        <div className="mb-4 flex items-center justify-between rounded-lg bg-gray-50 p-4">
          <div>
            <p className="font-semibold text-gray-800">배달 주문 접수</p>
            <p className="text-sm text-gray-500">꺼두면 배달앱에서 주문을 받을 수 없습니다.</p>
          </div>
          <button
            onClick={() => setForm((prev) => ({ ...prev, isDeliveryEnabled: !prev.isDeliveryEnabled }))}
            className={`rounded-full px-4 py-2 text-sm font-bold ${form.isDeliveryEnabled ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
          >
            {form.isDeliveryEnabled ? 'ON' : 'OFF'}
          </button>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Field label="최소 주문금액" value={form.minimumOrderAmount} numeric onChange={(value) => setForm((prev) => ({ ...prev, minimumOrderAmount: value }))} />
          <Field label="배달비" value={form.deliveryFee} numeric onChange={(value) => setForm((prev) => ({ ...prev, deliveryFee: value }))} />
          <Field label="무료배달 기준" value={form.freeDeliveryThreshold} numeric onChange={(value) => setForm((prev) => ({ ...prev, freeDeliveryThreshold: value }))} />
          <Field label="예상 배달시간(분)" value={form.estimatedDeliveryMinutes} numeric onChange={(value) => setForm((prev) => ({ ...prev, estimatedDeliveryMinutes: value }))} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-gray-800">메뉴 관리 방식</h3>
        <div className="grid gap-3 md:grid-cols-2">
          <ModeButton
            active={form.menuManagementMode === 'TOSS_POS'}
            title="Toss POS 연동"
            description="Toss POS 메뉴를 원본으로 사용하고 동기화된 메뉴만 고객에게 노출합니다."
            onClick={() => setForm((prev) => ({ ...prev, menuManagementMode: 'TOSS_POS' }))}
          />
          <ModeButton
            active={form.menuManagementMode === 'ADMIN_DIRECT'}
            title="관리자 직접 등록"
            description="관리자 화면에서 카테고리와 메뉴를 직접 등록해 고객에게 노출합니다."
            onClick={() => setForm((prev) => ({ ...prev, menuManagementMode: 'ADMIN_DIRECT' }))}
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h3 className="font-bold text-gray-800">초대 코드</h3>
            <p className="mt-1 font-mono text-sm text-gray-600">{selectedStore.inviteCode || '초대 코드 없음'}</p>
          </div>
          <button
            onClick={() => refreshInviteMutation.mutate()}
            disabled={refreshInviteMutation.isPending}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-60"
          >
            <Ticket className="h-4 w-4" />
            재발급
          </button>
        </div>
      </section>

      <div className="flex justify-end">
        <button
          onClick={() => updateStoreMutation.mutate()}
          disabled={updateStoreMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-bold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {updateStoreMutation.isPending ? '저장 중...' : '저장'}
        </button>
      </div>

      {isAdmin && (
        <CreateStoreSection authHeaders={authHeaders} onCreated={refetchStores} />
      )}
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  numeric = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  numeric?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(numeric ? event.target.value.replace(/[^0-9]/g, '') : event.target.value)}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}

function CreateStoreSection({
  authHeaders,
  onCreated,
}: {
  authHeaders?: { Authorization: string };
  onCreated: () => Promise<unknown>;
}) {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    storeType: '',
    branchId: '',
    name: '',
    branchName: '',
    phoneNumber: '',
    address: '',
  });
  const [error, setError] = useState<string | null>(null);

  const createMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/stores`,
        {
          storeType: form.storeType.trim(),
          branchId: form.branchId.trim(),
          name: form.name.trim(),
          branchName: form.branchName.trim(),
          phoneNumber: form.phoneNumber.trim() || undefined,
          address: form.address.trim() || undefined,
        },
        { headers: authHeaders }
      );
    },
    onSuccess: async () => {
      await onCreated();
      setOpen(false);
      setForm({ storeType: '', branchId: '', name: '', branchName: '', phoneNumber: '', address: '' });
      setError(null);
    },
    onError: (err: any) => {
      setError(err.response?.data?.message || '매장 생성에 실패했습니다.');
    },
  });

  if (!open) {
    return (
      <section className="rounded-xl border border-dashed border-gray-300 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-gray-800">새 매장 등록</h3>
            <p className="mt-1 text-sm text-gray-500">ADMIN 전용 — 새 매장을 생성하고 초대코드를 발급합니다.</p>
          </div>
          <button
            onClick={() => setOpen(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-700"
          >
            <Plus className="h-4 w-4" />
            새 매장 만들기
          </button>
        </div>
      </section>
    );
  }

  const canSubmit =
    form.storeType.trim() && form.branchId.trim() && form.name.trim() && form.branchName.trim();

  return (
    <section className="rounded-xl border border-gray-900 bg-white p-5 shadow-sm">
      <h3 className="mb-4 font-bold text-gray-800">새 매장 등록</h3>
      <div className="grid gap-4 md:grid-cols-2">
        <Field
          label="매장 타입 (URL용) *"
          value={form.storeType}
          onChange={(v) => setForm((p) => ({ ...p, storeType: v }))}
        />
        <Field
          label="지점 ID (URL용) *"
          value={form.branchId}
          onChange={(v) => setForm((p) => ({ ...p, branchId: v }))}
        />
        <Field
          label="매장명 *"
          value={form.name}
          onChange={(v) => setForm((p) => ({ ...p, name: v }))}
        />
        <Field
          label="지점명 *"
          value={form.branchName}
          onChange={(v) => setForm((p) => ({ ...p, branchName: v }))}
        />
        <Field
          label="전화번호"
          value={form.phoneNumber}
          onChange={(v) => setForm((p) => ({ ...p, phoneNumber: v }))}
        />
        <Field
          label="주소"
          value={form.address}
          onChange={(v) => setForm((p) => ({ ...p, address: v }))}
        />
      </div>

      {error && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">{error}</p>
      )}

      <div className="mt-4 flex gap-3 justify-end">
        <button
          onClick={() => { setOpen(false); setError(null); }}
          className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          취소
        </button>
        <button
          onClick={() => createMutation.mutate()}
          disabled={!canSubmit || createMutation.isPending}
          className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-4 py-2 text-sm font-bold text-white hover:bg-gray-700 disabled:opacity-50"
        >
          <Plus className="h-4 w-4" />
          {createMutation.isPending ? '생성 중...' : '매장 생성'}
        </button>
      </div>
    </section>
  );
}

function ModeButton({
  active,
  title,
  description,
  onClick,
}: {
  active: boolean;
  title: string;
  description: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-xl border p-4 text-left transition-colors ${active ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}`}
    >
      <p className="font-bold text-gray-900">{title}</p>
      <p className="mt-1 text-sm text-gray-500">{description}</p>
    </button>
  );
}
