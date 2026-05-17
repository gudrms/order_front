'use client';

import React, { useMemo, useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Plus, Printer } from 'lucide-react';
import { useAdminStore } from '@/contexts/AdminStoreContext';

interface AdminTable {
  id: string;
  storeId: string;
  tableNumber: number;
  capacity: number;
  status: 'AVAILABLE' | 'OCCUPIED' | 'RESERVED';
}

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const TABLE_ORDER_BASE_URL = process.env.NEXT_PUBLIC_TABLE_ORDER_URL || 'https://table-order.vercel.app';

export default function TableManagementPage() {
  const queryClient = useQueryClient();
  const { selectedStore, selectedStoreId, isLoading: isStoreLoading, authHeaders } = useAdminStore();
  const componentRef = useRef<HTMLDivElement>(null);
  const [bulkForm, setBulkForm] = useState({
    startNumber: '1',
    count: '10',
    capacity: '4',
  });

  const tablesQuery = useQuery<AdminTable[]>({
    queryKey: ['admin-tables', selectedStoreId],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/stores/${selectedStoreId}/tables`, {
        headers: authHeaders,
      });
      return response.data.data || response.data;
    },
    enabled: !!selectedStoreId,
  });

  const createTablesMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/stores/${selectedStoreId}/tables/bulk`,
        {
          startNumber: Number(bulkForm.startNumber),
          count: Number(bulkForm.count),
          capacity: Number(bulkForm.capacity || 4),
        },
        { headers: authHeaders }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-tables', selectedStoreId] });
    },
  });

  const handlePrint = useReactToPrint({
    contentRef: componentRef,
  });

  const tables = tablesQuery.data || [];
  const qrTables = useMemo(() => (
    tables.map((table) => ({
      ...table,
      qrUrl: selectedStore
        ? `${TABLE_ORDER_BASE_URL}/${selectedStore.storeType}/${selectedStore.branchId}/table/${table.tableNumber}`
        : '',
    }))
  ), [selectedStore, tables]);

  if (isStoreLoading || tablesQuery.isLoading) {
    return <div className="py-12 text-center text-gray-500">테이블을 불러오는 중입니다.</div>;
  }

  if (!selectedStore || !selectedStoreId) {
    return (
      <div className="rounded-xl border border-dashed border-gray-300 bg-white p-10 text-center">
        <h2 className="text-xl font-bold text-gray-800">연결된 매장이 없습니다</h2>
        <p className="mt-2 text-sm text-gray-500">마스터 관리자에게 계정과 매장 연결을 요청해 주세요.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">테이블 관리 & QR 코드</h2>
          <p className="mt-1 text-sm text-gray-500">
            {selectedStore.name}의 테이블 QR 코드를 생성하고 출력합니다.
          </p>
        </div>
        <button
          onClick={() => handlePrint && handlePrint()}
          disabled={qrTables.length === 0}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          <Printer className="h-4 w-4" />
          QR 전체 출력
        </button>
      </div>

      <section className="rounded-xl border border-gray-100 bg-white p-5 shadow-sm">
        <h3 className="mb-4 font-bold text-gray-800">테이블 일괄 생성</h3>
        <div className="grid gap-3 md:grid-cols-[1fr_1fr_1fr_auto]">
          <Field label="시작 번호" value={bulkForm.startNumber} onChange={(value) => setBulkForm((prev) => ({ ...prev, startNumber: value }))} />
          <Field label="생성 개수" value={bulkForm.count} onChange={(value) => setBulkForm((prev) => ({ ...prev, count: value }))} />
          <Field label="기본 인원" value={bulkForm.capacity} onChange={(value) => setBulkForm((prev) => ({ ...prev, capacity: value }))} />
          <button
            onClick={() => createTablesMutation.mutate()}
            disabled={createTablesMutation.isPending || Number(bulkForm.startNumber) < 1 || Number(bulkForm.count) < 1}
            className="mt-6 inline-flex h-10 items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50 md:mt-7"
          >
            <Plus className="h-4 w-4" />
            생성
          </button>
        </div>
        {createTablesMutation.isError && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            {createTablesMutation.error instanceof Error ? createTablesMutation.error.message : '테이블 생성에 실패했습니다.'}
          </p>
        )}
      </section>

      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {qrTables.map((table) => (
          <div key={table.id} className="flex flex-col items-center rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="mb-4 rounded-lg border bg-white p-2">
              <QRCodeSVG value={table.qrUrl} size={120} />
            </div>
            <h3 className="mb-1 text-lg font-bold text-gray-800">테이블 {table.tableNumber}</h3>
            <p className="mb-2 text-xs text-gray-500">{table.capacity}인석 · {table.status}</p>
            <p className="break-all px-2 text-center text-xs text-gray-400">{table.qrUrl}</p>
          </div>
        ))}
      </div>

      {qrTables.length === 0 && (
        <div className="rounded-xl border border-dashed border-gray-300 bg-white py-16 text-center text-gray-500">
          생성된 테이블이 없습니다. 일괄 생성으로 테이블을 추가하세요.
        </div>
      )}

      <div style={{ display: 'none' }}>
        <div ref={componentRef} className="grid grid-cols-3 gap-8 p-8">
          {qrTables.map((table) => (
            <div key={table.id} className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 p-8">
              <h2 className="mb-4 text-2xl font-black">테이블 {table.tableNumber}</h2>
              <QRCodeSVG value={table.qrUrl} size={200} />
              <p className="mt-4 text-sm text-gray-500">스마트폰으로 스캔하여 주문하세요.</p>
              <p className="mt-1 text-xs font-mono text-gray-400">{selectedStore.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-semibold text-gray-700">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value.replace(/[^0-9]/g, ''))}
        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
      />
    </label>
  );
}
