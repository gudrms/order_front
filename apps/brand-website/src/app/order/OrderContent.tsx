'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

const TossPaymentWidget = dynamic(
    () => import('@order/ui/payment').then((m) => ({ default: m.TossPaymentWidget })),
    { ssr: false },
);

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';
const TOSS_CLIENT_KEY = process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY || 'test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq';
const PENDING_ORDER_KEY = 'brand.homepage.pendingOrder';

interface Store {
    id: string;
    name: string;
    branchName?: string;
    isActive: boolean;
    isDeliveryEnabled: boolean;
    minimumOrderAmount: number;
    deliveryFee: number;
    freeDeliveryThreshold: number | null;
    estimatedDeliveryMinutes: number | null;
}

interface Category {
    id: string;
    name: string;
    sortOrder: number;
}

interface MenuItem {
    id: string;
    name: string;
    description: string | null;
    price: number;
    imageUrl: string | null;
    isAvailable: boolean;
    categoryId: string;
}

interface CartItem {
    menuId: string;
    menuName: string;
    price: number;
    quantity: number;
}

interface DeliveryForm {
    recipientName: string;
    recipientPhone: string;
    address: string;
    detailAddress: string;
    deliveryMemo: string;
}

async function requestJson<T>(url: string, options?: RequestInit): Promise<T> {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            ...options?.headers,
        },
    });
    const payload = await response.json().catch(() => null);

    if (!response.ok) {
        const message = payload?.message || '요청 처리 중 오류가 발생했습니다.';
        throw new Error(Array.isArray(message) ? message.join(', ') : message);
    }

    return payload?.data ?? payload;
}

function makeOrderId() {
    return `HOMEPAGE_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

export default function OrderContent() {
    const searchParams = useSearchParams();
    const initialStoreId = searchParams.get('storeId');
    const paymentWidgetRef = useRef<any>(null);

    const [stores, setStores] = useState<Store[]>([]);
    const [selectedStoreId, setSelectedStoreId] = useState('');
    const [categories, setCategories] = useState<Category[]>([]);
    const [activeCategory, setActiveCategory] = useState('');
    const [menus, setMenus] = useState<MenuItem[]>([]);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [form, setForm] = useState<DeliveryForm>({
        recipientName: '',
        recipientPhone: '',
        address: '',
        detailAddress: '',
        deliveryMemo: '',
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const selectedStore = stores.find((store) => store.id === selectedStoreId) || null;
    const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const deliveryFee = selectedStore && selectedStore.freeDeliveryThreshold && subtotal >= selectedStore.freeDeliveryThreshold
        ? 0
        : selectedStore?.deliveryFee || 0;
    const totalAmount = subtotal + deliveryFee;
    const isBelowMinimum = !!selectedStore && subtotal > 0 && subtotal < selectedStore.minimumOrderAmount;
    const canOrder = !!selectedStore
        && selectedStore.isActive
        && selectedStore.isDeliveryEnabled
        && cart.length > 0
        && !isBelowMinimum
        && !!form.recipientName.trim()
        && !!form.recipientPhone.trim()
        && !!form.address.trim()
        && !isProcessing;

    const disabledReason = useMemo(() => {
        if (!selectedStore) return '주문할 매장을 선택해주세요.';
        if (!selectedStore.isActive) return '현재 운영 중인 매장이 아닙니다.';
        if (!selectedStore.isDeliveryEnabled) return '현재 배달 주문을 받지 않는 매장입니다.';
        if (cart.length === 0) return '메뉴를 장바구니에 담아주세요.';
        if (isBelowMinimum) return `최소 주문금액은 ${selectedStore.minimumOrderAmount.toLocaleString()}원입니다.`;
        if (!form.recipientName.trim() || !form.recipientPhone.trim() || !form.address.trim()) return '배송 정보를 입력해주세요.';
        return null;
    }, [cart.length, form.address, form.recipientName, form.recipientPhone, isBelowMinimum, selectedStore]);

    useEffect(() => {
        requestJson<Store[]>(`${API_URL}/stores`)
            .then((data) => {
                const orderableStores = data.filter((store) => store.isActive && store.isDeliveryEnabled);
                setStores(data);
                setSelectedStoreId(
                    data.find((store) => store.id === initialStoreId)?.id
                    || orderableStores[0]?.id
                    || data[0]?.id
                    || '',
                );
            })
            .catch((err) => setError(err instanceof Error ? err.message : '매장 정보를 불러오지 못했습니다.'))
            .finally(() => setIsLoading(false));
    }, [initialStoreId]);

    useEffect(() => {
        if (!selectedStoreId) return;
        setCategories([]);
        setActiveCategory('');
        setMenus([]);
        setCart([]);

        requestJson<Category[]>(`${API_URL}/stores/${selectedStoreId}/categories`)
            .then((data) => {
                const sorted = [...data].sort((a, b) => a.sortOrder - b.sortOrder);
                setCategories(sorted);
                setActiveCategory(sorted[0]?.id || '');
            })
            .catch((err) => setError(err instanceof Error ? err.message : '카테고리를 불러오지 못했습니다.'));
    }, [selectedStoreId]);

    useEffect(() => {
        if (!selectedStoreId || !activeCategory) return;
        requestJson<MenuItem[]>(`${API_URL}/stores/${selectedStoreId}/menus?categoryId=${activeCategory}`)
            .then((data) => setMenus(data.filter((menu) => menu.isAvailable)))
            .catch((err) => setError(err instanceof Error ? err.message : '메뉴를 불러오지 못했습니다.'));
    }, [activeCategory, selectedStoreId]);

    const addToCart = (menu: MenuItem) => {
        setCart((prev) => {
            const existing = prev.find((item) => item.menuId === menu.id);
            if (existing) {
                return prev.map((item) => item.menuId === menu.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { menuId: menu.id, menuName: menu.name, price: menu.price, quantity: 1 }];
        });
    };

    const updateQuantity = (menuId: string, delta: number) => {
        setCart((prev) => prev
            .map((item) => item.menuId === menuId ? { ...item, quantity: item.quantity + delta } : item)
            .filter((item) => item.quantity > 0));
    };

    const handlePayment = async () => {
        if (!canOrder || !selectedStore) return;
        const paymentWidget = paymentWidgetRef.current;
        if (!paymentWidget) {
            setError('결제 위젯을 아직 준비 중입니다. 잠시 후 다시 시도해주세요.');
            return;
        }

        try {
            setIsProcessing(true);
            setError(null);

            const orderId = makeOrderId();
            const order = await requestJson<{ id: string; orderNumber: string }>(`${API_URL}/orders/homepage`, {
                method: 'POST',
                body: JSON.stringify({
                    storeId: selectedStore.id,
                    source: 'HOMEPAGE',
                    delivery: {
                        recipientName: form.recipientName.trim(),
                        recipientPhone: form.recipientPhone.trim(),
                        address: form.address.trim(),
                        detailAddress: form.detailAddress.trim() || undefined,
                        deliveryMemo: form.deliveryMemo.trim() || undefined,
                    },
                    items: cart.map((item) => ({
                        menuId: item.menuId,
                        menuName: item.menuName,
                        quantity: item.quantity,
                        price: item.price,
                        options: [],
                    })),
                    totalAmount,
                    payment: {
                        orderId,
                        amount: totalAmount,
                        paymentType: 'NORMAL',
                        method: 'TOSS',
                    },
                }),
            });

            sessionStorage.setItem(PENDING_ORDER_KEY, JSON.stringify({
                orderId,
                backendOrderId: order.id,
                orderNumber: order.orderNumber,
                storeName: `${selectedStore.name}${selectedStore.branchName ? ` ${selectedStore.branchName}` : ''}`,
                address: form.address,
                totalAmount,
            }));

            await paymentWidget.requestPayment({
                orderId,
                orderName: cart.length > 1 ? `${cart[0].menuName} 외 ${cart.length - 1}건` : cart[0].menuName,
                customerName: form.recipientName,
                successUrl: `${window.location.origin}/order/success`,
                failUrl: `${window.location.origin}/order/fail`,
            });
        } catch (err) {
            setError(err instanceof Error ? err.message : '주문 생성 또는 결제 요청 중 오류가 발생했습니다.');
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 text-brand-black">
            <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_380px]">
                <section className="space-y-6">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                        <div>
                            <p className="text-sm font-bold text-brand-green">ONLINE ORDER</p>
                            <h1 className="text-3xl font-black">홈페이지 바로 주문</h1>
                        </div>
                        <Link href="/menu" className="text-sm font-bold text-gray-500 hover:text-brand-black">
                            메뉴만 둘러보기
                        </Link>
                    </div>

                    {error && (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                            {error}
                        </div>
                    )}

                    <div className="rounded-lg border border-gray-200 bg-white p-4">
                        <label className="mb-2 block text-sm font-bold">주문 매장</label>
                        <select
                            value={selectedStoreId}
                            onChange={(event) => setSelectedStoreId(event.target.value)}
                            className="w-full rounded-lg border border-gray-200 px-3 py-3 outline-none focus:border-brand-yellow"
                        >
                            {stores.map((store) => (
                                <option key={store.id} value={store.id}>
                                    {store.name} {store.branchName || ''}
                                </option>
                            ))}
                        </select>
                        {selectedStore && (
                            <p className="mt-2 text-sm text-gray-500">
                                최소 {selectedStore.minimumOrderAmount.toLocaleString()}원 · 배달비 {selectedStore.deliveryFee.toLocaleString()}원
                                {selectedStore.freeDeliveryThreshold ? ` · ${selectedStore.freeDeliveryThreshold.toLocaleString()}원 이상 무료` : ''}
                            </p>
                        )}
                    </div>

                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {categories.map((category) => (
                            <button
                                key={category.id}
                                onClick={() => setActiveCategory(category.id)}
                                className={`shrink-0 rounded-lg px-4 py-2 text-sm font-bold transition ${
                                    activeCategory === category.id
                                        ? 'bg-brand-black text-white'
                                        : 'bg-white text-gray-600 hover:bg-gray-100'
                                }`}
                            >
                                {category.name}
                            </button>
                        ))}
                    </div>

                    {isLoading ? (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {[...Array(4)].map((_, index) => (
                                <div key={index} className="h-44 animate-pulse rounded-lg bg-white" />
                            ))}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2">
                            {menus.map((menu) => (
                                <article key={menu.id} className="overflow-hidden rounded-lg border border-gray-200 bg-white">
                                    <div className="h-40 bg-gray-100">
                                        {menu.imageUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={menu.imageUrl} alt={menu.name} className="h-full w-full object-cover" />
                                        ) : (
                                            <div className="flex h-full items-center justify-center text-sm text-gray-400">이미지 준비 중</div>
                                        )}
                                    </div>
                                    <div className="p-4">
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <h2 className="font-bold">{menu.name}</h2>
                                                {menu.description && <p className="mt-1 line-clamp-2 text-sm text-gray-500">{menu.description}</p>}
                                            </div>
                                            <span className="shrink-0 font-bold">{menu.price.toLocaleString()}원</span>
                                        </div>
                                        <button
                                            onClick={() => addToCart(menu)}
                                            className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-brand-yellow px-4 py-3 font-bold text-brand-black hover:bg-yellow-300"
                                        >
                                            <Plus size={18} />
                                            담기
                                        </button>
                                    </div>
                                </article>
                            ))}
                        </div>
                    )}
                </section>

                <aside className="h-fit rounded-lg border border-gray-200 bg-white p-4 lg:sticky lg:top-6">
                    <div className="mb-4 flex items-center gap-2">
                        <ShoppingBag size={20} />
                        <h2 className="text-lg font-black">주문서</h2>
                    </div>

                    <div className="space-y-3">
                        {cart.length === 0 ? (
                            <p className="rounded-lg bg-gray-50 px-3 py-8 text-center text-sm text-gray-400">담긴 메뉴가 없습니다.</p>
                        ) : cart.map((item) => (
                            <div key={item.menuId} className="rounded-lg border border-gray-100 p-3">
                                <div className="flex justify-between gap-3">
                                    <div>
                                        <p className="font-bold">{item.menuName}</p>
                                        <p className="text-sm text-gray-500">{(item.price * item.quantity).toLocaleString()}원</p>
                                    </div>
                                    <button onClick={() => updateQuantity(item.menuId, -item.quantity)} className="text-gray-400 hover:text-red-500" aria-label="삭제">
                                        <Trash2 size={17} />
                                    </button>
                                </div>
                                <div className="mt-3 flex items-center gap-2">
                                    <button onClick={() => updateQuantity(item.menuId, -1)} className="rounded-md border border-gray-200 p-1" aria-label="수량 줄이기">
                                        <Minus size={16} />
                                    </button>
                                    <span className="w-8 text-center font-bold">{item.quantity}</span>
                                    <button onClick={() => updateQuantity(item.menuId, 1)} className="rounded-md border border-gray-200 p-1" aria-label="수량 늘리기">
                                        <Plus size={16} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="mt-5 space-y-3 border-t border-gray-100 pt-4">
                        <input value={form.recipientName} onChange={(event) => setForm({ ...form, recipientName: event.target.value })} placeholder="받는 분" className="w-full rounded-lg border border-gray-200 px-3 py-3 outline-none focus:border-brand-yellow" />
                        <input value={form.recipientPhone} onChange={(event) => setForm({ ...form, recipientPhone: event.target.value })} placeholder="연락처" className="w-full rounded-lg border border-gray-200 px-3 py-3 outline-none focus:border-brand-yellow" />
                        <input value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} placeholder="주소" className="w-full rounded-lg border border-gray-200 px-3 py-3 outline-none focus:border-brand-yellow" />
                        <input value={form.detailAddress} onChange={(event) => setForm({ ...form, detailAddress: event.target.value })} placeholder="상세주소" className="w-full rounded-lg border border-gray-200 px-3 py-3 outline-none focus:border-brand-yellow" />
                        <textarea value={form.deliveryMemo} onChange={(event) => setForm({ ...form, deliveryMemo: event.target.value })} placeholder="요청사항" rows={3} className="w-full resize-none rounded-lg border border-gray-200 px-3 py-3 outline-none focus:border-brand-yellow" />
                    </div>

                    <div className="mt-5 space-y-2 border-t border-gray-100 pt-4 text-sm">
                        <div className="flex justify-between"><span className="text-gray-500">메뉴 금액</span><span className="font-bold">{subtotal.toLocaleString()}원</span></div>
                        <div className="flex justify-between"><span className="text-gray-500">배달비</span><span className="font-bold">{deliveryFee.toLocaleString()}원</span></div>
                        <div className="flex justify-between text-lg"><span className="font-black">결제 금액</span><span className="font-black text-brand-green">{totalAmount.toLocaleString()}원</span></div>
                    </div>

                    {totalAmount > 0 && (
                        <div className="mt-4 rounded-lg border border-gray-100">
                            <TossPaymentWidget
                                clientKey={TOSS_CLIENT_KEY}
                                customerKey={`homepage-${form.recipientPhone || 'guest'}`}
                                amount={totalAmount}
                                onWidgetReady={(widget) => {
                                    paymentWidgetRef.current = widget;
                                }}
                            />
                        </div>
                    )}

                    {disabledReason && <p className="mt-3 text-center text-sm text-red-500">{disabledReason}</p>}
                    <button onClick={handlePayment} disabled={!canOrder} className="mt-3 w-full rounded-lg bg-brand-black px-4 py-4 font-bold text-white disabled:cursor-not-allowed disabled:opacity-40">
                        {isProcessing ? '결제 준비 중...' : `${totalAmount.toLocaleString()}원 결제하기`}
                    </button>
                </aside>
            </div>
        </main>
    );
}
