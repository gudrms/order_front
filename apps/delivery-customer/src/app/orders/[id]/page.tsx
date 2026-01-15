'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Receipt } from 'lucide-react';
import { supabase } from '@order/shared';
import type { Order } from '@order/shared';
import { OrderStatusTracker } from '@/components/order/OrderStatusTracker';

export default function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const { id } = use(params);
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchOrder = async () => {
            try {
                const { data, error } = await supabase
                    .from('Order')
                    .select(`
            *,
            items:OrderItem (
              *,
              options:OrderItemOption (
                name,
                price
              )
            )
          `)
                    .eq('id', id)
                    .single();

                if (error) throw error;
                setOrder(data as any); // TODO: Type assertion fix
            } catch (error) {
                console.error('Error fetching order:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchOrder();
    }, [id]);

    if (loading) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-yellow" />
            </main>
        );
    }

    if (!order) {
        return (
            <main className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p>주문을 찾을 수 없습니다.</p>
            </main>
        );
    }

    return (
        <main className="min-h-screen bg-gray-50 pb-20">
            {/* Header */}
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="flex items-center justify-between px-4 h-14">
                    <button onClick={() => router.back()} className="p-2 -ml-2 text-brand-black">
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg">주문 상세</h1>
                    <div className="w-10" />
                </div>
            </header>

            <div className="max-w-[568px] mx-auto p-4 space-y-4">
                {/* Status Tracker */}
                <OrderStatusTracker orderId={order.id} initialStatus={order.status} />

                {/* Order Info */}
                <section className="bg-white rounded-xl p-4 space-y-4 shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 pb-4 border-b border-gray-100">
                        <Receipt className="text-brand-yellow" size={24} />
                        <h2 className="font-bold text-lg">주문 내역</h2>
                    </div>

                    <div className="space-y-4">
                        {order.items.map((item) => (
                            <div key={item.id} className="flex justify-between">
                                <div>
                                    <p className="font-medium">{item.menuName}</p>
                                    {/* Options display would go here if mapped correctly from DB */}
                                    <p className="text-sm text-gray-500">
                                        {item.quantity}개
                                    </p>
                                </div>
                                <p className="font-medium">
                                    {(item.totalPrice).toLocaleString()}원
                                </p>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-gray-100 space-y-2">
                        <div className="flex justify-between text-lg font-bold">
                            <span>총 결제 금액</span>
                            <span className="text-brand-yellow">
                                {order.totalPrice.toLocaleString()}원
                            </span>
                        </div>
                    </div>
                </section>

                {/* Delivery Info */}
                <section className="bg-white rounded-xl p-4 space-y-4 shadow-sm border border-gray-100">
                    <h2 className="font-bold text-lg">배달 정보</h2>
                    <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-500">주문번호</span>
                            <span className="font-medium">{order.orderNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-500">주문일시</span>
                            <span className="font-medium">
                                {new Date(order.createdAt).toLocaleString()}
                            </span>
                        </div>
                    </div>
                </section>
            </div>
        </main>
    );
}
