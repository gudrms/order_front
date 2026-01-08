'use client';

import React, { useState, useRef } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { useReactToPrint } from 'react-to-print';
import { Plus, Trash2, Printer } from 'lucide-react';
import { Button } from '@order/ui';

interface Table {
  id: string;
  number: number;
  qrUrl: string;
}

export default function TableManagementPage() {
  // 임시 상태 (나중엔 DB 연동)
  const [tables, setTables] = useState<Table[]>([
    { id: '1', number: 1, qrUrl: 'https://table-order.vercel.app/store/store-1/table/1' },
    { id: '2', number: 2, qrUrl: 'https://table-order.vercel.app/store/store-1/table/2' },
  ]);

  const componentRef = useRef<HTMLDivElement>(null);
  
  // 인쇄 기능
  const handlePrint = useReactToPrint({
    contentRef: componentRef, // v17.0.0+ 에서는 contentRef 사용 권장
  });

  const addTable = () => {
    const newNumber = tables.length > 0 ? Math.max(...tables.map(t => t.number)) + 1 : 1;
    const newTable: Table = {
      id: Date.now().toString(),
      number: newNumber,
      qrUrl: `https://table-order.vercel.app/store/store-1/table/${newNumber}`,
    };
    setTables([...tables, newTable]);
  };

  const removeTable = (id: string) => {
    setTables(tables.filter(t => t.id !== id));
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">테이블 관리 & QR 코드</h2>
          <p className="text-gray-500 text-sm mt-1">
            테이블별 QR 코드를 생성하고 인쇄하여 부착하세요.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={addTable} className="bg-blue-600 hover:bg-blue-700">
            <Plus className="w-4 h-4 mr-2" /> 테이블 추가
          </Button>
          <Button onClick={() => handlePrint && handlePrint()} variant="outline" className="border-gray-300">
            <Printer className="w-4 h-4 mr-2" /> QR 전체 인쇄
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {tables.map((table) => (
          <div key={table.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col items-center relative group">
            <button 
              onClick={() => removeTable(table.id)}
              className="absolute top-2 right-2 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            
            <div className="mb-4 p-2 bg-white border rounded-lg">
              <QRCodeSVG value={table.qrUrl} size={120} />
            </div>
            
            <h3 className="text-lg font-bold text-gray-800 mb-1">
              테이블 {table.number}
            </h3>
            <p className="text-xs text-gray-400 break-all text-center px-2">
              {table.qrUrl}
            </p>
          </div>
        ))}
      </div>

      {/* 인쇄용 숨겨진 컴포넌트 */}
      <div style={{ display: 'none' }}>
        <div ref={componentRef} className="p-8 grid grid-cols-3 gap-8">
          {tables.map((table) => (
            <div key={table.id} className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 p-8 rounded-xl page-break-inside-avoid">
              <h2 className="text-2xl font-black mb-4">테이블 {table.number}</h2>
              <QRCodeSVG value={table.qrUrl} size={200} />
              <p className="mt-4 text-sm text-gray-500">스마트폰으로 스캔하여 주문하세요</p>
              <p className="mt-1 text-xs font-mono text-gray-400">타코몰리 김포점</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
