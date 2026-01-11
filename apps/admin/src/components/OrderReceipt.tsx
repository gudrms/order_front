/**
 * 주문서 프린트 컴포넌트
 * 영수증 프린터 출력에 최적화된 포맷
 */

import React from 'react';
import { Order, formatCurrency, formatDate } from '@order/shared';

interface OrderReceiptProps {
  order: Order;
  onPrintComplete?: () => void;
}

export function OrderReceipt({ order, onPrintComplete }: OrderReceiptProps) {
  const handlePrint = () => {
    window.print();
    onPrintComplete?.();
  };

  return (
    <div>
      {/* 프린트 버튼 (출력 시 숨김) */}
      <div className="no-print mb-4">
        <button
          onClick={handlePrint}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
        >
          프린트하기
        </button>
      </div>

      {/* 주문서 내용 (프린트용) */}
      <div className="print-only receipt-paper">
        <div className="receipt-content">
          {/* 헤더 */}
          <div className="text-center mb-4 pb-4 border-b-2 border-dashed border-gray-800">
            <h1 className="text-2xl font-bold mb-2">주문서</h1>
            <div className="text-sm text-gray-600">
              <p>주문번호: {order.orderNumber}</p>
              <p>{formatDate(order.createdAt)}</p>
            </div>
          </div>

          {/* 테이블 정보 */}
          <div className="mb-4 pb-4 border-b-2 border-dashed border-gray-800">
            <div className="text-center">
              <p className="text-xl font-bold">테이블: {order.tableNumber}번</p>
              {/* {order.customerName && (
                <p className="text-sm text-gray-600 mt-1">고객: {order.customerName}</p>
              )} */}
            </div>
          </div>

          {/* 주문 항목 */}
          <div className="mb-4 pb-4 border-b-2 border-dashed border-gray-800">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2">메뉴</th>
                  <th className="text-center py-2">수량</th>
                  <th className="text-right py-2">금액</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <React.Fragment key={item.id}>
                    <tr>
                      <td className="py-2 font-medium">{item.menuName}</td>
                      <td className="text-center">{item.quantity}</td>
                      <td className="text-right">{formatCurrency(item.totalPrice)}</td>
                    </tr>
                    {/* 옵션 표시 */}
                    {item.options && item.options.length > 0 && (
                      <tr>
                        <td colSpan={3} className="text-sm text-gray-600 pl-4 pb-2">
                          {item.options.map((group) =>
                            group.items.map((opt) => (
                              <div key={opt.optionItemId}>
                                ㄴ {opt.name}
                                {opt.price > 0 && ` (+${formatCurrency(opt.price)})`}
                              </div>
                            ))
                          )}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* 특이사항 */}
          {/* {order.specialRequests && (
            <div className="mb-4 pb-4 border-b-2 border-dashed border-gray-800">
              <p className="font-bold mb-2">특이사항:</p>
              <p className="text-sm whitespace-pre-wrap">{order.specialRequests}</p>
            </div>
          )} */}

          {/* 합계 */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>합계</span>
              <span>{formatCurrency(order.totalPrice)}</span>
            </div>
          </div>

          {/* 푸터 */}
          <div className="text-center text-sm text-gray-600 mt-6 pt-4 border-t border-gray-800">
            <p>이용해 주셔서 감사합니다!</p>
          </div>
        </div>
      </div>

      {/* 프린트용 스타일 */}
      <style jsx>{`
        /* 화면에서는 숨김, 프린트 시만 표시 */
        .print-only {
          display: none;
        }

        /* 프린트 버튼은 프린트 시 숨김 */
        @media print {
          .no-print {
            display: none !important;
          }

          .print-only {
            display: block !important;
          }

          /* 프린트 페이지 설정 */
          @page {
            size: 80mm auto; /* 영수증 프린터 너비 (80mm) */
            margin: 5mm;
          }

          body {
            margin: 0;
            padding: 0;
          }

          /* 영수증 용지 스타일 */
          .receipt-paper {
            width: 80mm;
            margin: 0 auto;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            line-height: 1.4;
            color: #000;
          }

          .receipt-content {
            padding: 5mm;
          }

          /* 테이블 스타일 */
          table {
            width: 100%;
            border-collapse: collapse;
          }

          th, td {
            padding: 2mm 0;
          }

          /* 굵은 테두리 */
          .border-b-2 {
            border-bottom: 2px dashed #000 !important;
          }

          .border-t {
            border-top: 1px solid #000 !important;
          }
        }

        /* 화면 미리보기용 스타일 */
        .receipt-paper {
          max-width: 320px;
          margin: 0 auto;
          border: 1px solid #ddd;
          background: white;
          font-family: 'Courier New', monospace;
        }

        .receipt-content {
          padding: 20px;
        }
      `}</style>
    </div>
  );
}
