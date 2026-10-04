/**
 * 주문서 프린트 컴포넌트
 * 영수증 프린터 출력에 최적화된 포맷
 * 마운트되면 바로 출력한다 (화면에는 보이지 않고 인쇄 시에만 나타난다)
 */

import React from 'react';
import { Order, formatCurrency, formatDate } from '@order/shared';
import { getAdminElectronBridge } from '@/lib/electronBridge';
import { buildReceiptData } from '@/lib/receiptData';
import { getStoreRequest } from '@order/shared/utils/orderRequest';

interface OrderReceiptProps {
  order: Order;
  /** 출력이 끝나면(브라우저는 인쇄 대화상자가 닫히면) 호출 */
  onPrintComplete?: () => void;
  onPrintError?: (message: string) => void;
}

export function OrderReceipt({ order, onPrintComplete, onPrintError }: OrderReceiptProps) {
  // 개발 모드 StrictMode의 effect 이중 실행으로 두 번 출력되는 것을 막는다
  const printedRef = React.useRef(false);

  React.useEffect(() => {
    if (printedRef.current) return;
    printedRef.current = true;

    const print = async () => {
      const electronBridge = getAdminElectronBridge();
      if (electronBridge?.printReceipt) {
        try {
          const result = await electronBridge.printReceipt({
            orderId: order.id,
            orderNumber: order.orderNumber,
            silent: true,
            // PC 앱이 COM 포트로 직접 출력할 때 쓰는 주문서 내용
            receipt: buildReceiptData(order),
          });
          if (result && !result.success) {
            onPrintError?.(result.message || '영수증 출력에 실패했습니다.');
            return;
          }
          onPrintComplete?.();
        } catch (error) {
          onPrintError?.(error instanceof Error ? error.message : '영수증 출력에 실패했습니다.');
        }
        return;
      }

      window.print();
      onPrintComplete?.();
    };

    void print();
  }, [order, onPrintComplete, onPrintError]);

  return (
    <div data-testid="admin-order-receipt">

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
          {order.tableNumber != null && (
            <div className="mb-4 pb-4 border-b-2 border-dashed border-gray-800">
              <div className="text-center">
                <p className="text-xl font-bold">테이블: {order.tableNumber}번</p>
                {/* {order.customerName && (
                  <p className="text-sm text-gray-600 mt-1">고객: {order.customerName}</p>
                )} */}
              </div>
            </div>
          )}

          {/* 배달 정보 */}
          {order.delivery && (
            <div className="mb-4 pb-4 border-b-2 border-dashed border-gray-800 text-sm">
              <p className="text-lg font-bold text-center mb-2">배달 주문</p>
              {order.delivery.estimatedMinutes ? (
                <p className="text-center font-bold mb-2">예상 소요 {order.delivery.estimatedMinutes}분</p>
              ) : null}
              <p className="font-medium">
                {order.delivery.address}
                {order.delivery.detailAddress ? ` ${order.delivery.detailAddress}` : ''}
              </p>
              <p className="mt-1">{order.delivery.recipientPhone}</p>
              {getStoreRequest(order) && (
                <p className="mt-2 whitespace-pre-wrap">
                  가게 요청: {getStoreRequest(order)}
                </p>
              )}
              {order.delivery.deliveryMemo && (
                <p className="mt-2 whitespace-pre-wrap">
                  배달 요청: {order.delivery.deliveryMemo}
                </p>
              )}
            </div>
          )}

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

          {/* 배달비 */}
          {order.delivery && (
            <div className="mb-2 flex justify-between items-center text-sm">
              <span>배달비</span>
              <span>{formatCurrency(order.delivery.deliveryFee ?? 0)}</span>
            </div>
          )}

          {/* 합계 */}
          <div className="mb-4">
            <div className="flex justify-between items-center text-xl font-bold">
              <span>합계</span>
              <span>{formatCurrency(order.totalAmount ?? order.totalPrice)}</span>
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

        @media print {
          .print-only {
            display: block !important;
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

      {/* 페이지 전체에 걸리는 인쇄 규칙 — scoped 스타일 안에서는 @page·body가 적용되지 않는다.
          인쇄 시 주문서만 남기고 모달 제목·관리자 화면은 감춘다 (admin-electron 무음 출력도 창 전체를 인쇄하므로 동일하게 적용) */}
      <style jsx global>{`
        @media print {
          @page {
            size: 80mm auto; /* 영수증 프린터 너비 (80mm) */
            margin: 0;
          }

          body {
            margin: 0;
            padding: 0;
          }

          body * {
            visibility: hidden !important;
          }

          .receipt-paper,
          .receipt-paper * {
            visibility: visible !important;
          }

          .receipt-paper {
            position: fixed;
            top: 0;
            left: 0;
            border: none !important;
            max-width: none !important;
          }
        }
      `}</style>
    </div>
  );
}
