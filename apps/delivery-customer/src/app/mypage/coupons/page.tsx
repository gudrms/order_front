'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ChevronLeft, Tag, Ticket } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useMyCoupons, useRedeemCoupon } from '@/hooks/queries/useCoupons';
import type { UserCoupon } from '@order/shared';

function CouponCard({ uc }: { uc: UserCoupon }) {
    const expired = new Date(uc.expiresAt) < new Date();
    const dimmed = uc.isUsed || expired;

    const discountLabel = uc.coupon.type === 'PERCENTAGE'
        ? `${uc.coupon.discountValue}% 할인${uc.coupon.maxDiscountAmount ? ` (최대 ${uc.coupon.maxDiscountAmount.toLocaleString()}원)` : ''}`
        : `${uc.coupon.discountValue.toLocaleString()}원 할인`;

    const statusLabel = uc.isUsed ? '사용 완료' : expired ? '만료됨' : null;

    return (
        <div className={`relative bg-white rounded-xl border-2 p-4 ${dimmed ? 'border-gray-100 opacity-50' : 'border-purple-200'}`}>
            {statusLabel && (
                <span className="absolute top-3 right-3 text-xs font-semibold bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">
                    {statusLabel}
                </span>
            )}
            <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg flex-shrink-0 ${dimmed ? 'bg-gray-100 text-gray-400' : 'bg-purple-100 text-purple-600'}`}>
                    <Tag size={18} />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm">{uc.coupon.name}</p>
                    <p className="text-sm text-purple-600 font-bold mt-0.5">{discountLabel}</p>
                    {uc.coupon.description && (
                        <p className="text-xs text-gray-500 mt-1">{uc.coupon.description}</p>
                    )}
                    {uc.coupon.minOrderAmount && (
                        <p className="text-xs text-gray-400 mt-1">
                            최소 주문 {uc.coupon.minOrderAmount.toLocaleString()}원 이상
                        </p>
                    )}
                    <p className={`text-xs mt-2 ${dimmed ? 'text-gray-400' : 'text-gray-500'}`}>
                        {uc.isUsed && uc.usedAt
                            ? `${new Date(uc.usedAt).toLocaleDateString('ko-KR')} 사용`
                            : `만료: ${new Date(uc.expiresAt).toLocaleDateString('ko-KR')}`}
                    </p>
                </div>
            </div>
        </div>
    );
}

export default function CouponsPage() {
    const router = useRouter();
    const { user } = useAuth();
    const { data: coupons = [], isLoading } = useMyCoupons(user?.id);
    const redeemMutation = useRedeemCoupon(user?.id);

    const [promoCode, setPromoCode] = useState('');
    const [redeemError, setRedeemError] = useState('');
    const [redeemSuccess, setRedeemSuccess] = useState('');

    const activeCoupons = coupons.filter((c) => !c.isUsed && new Date(c.expiresAt) > new Date());
    const usedOrExpiredCoupons = coupons.filter((c) => c.isUsed || new Date(c.expiresAt) <= new Date());

    const handleRedeem = async () => {
        const code = promoCode.trim().toUpperCase();
        if (!code) return;
        setRedeemError('');
        setRedeemSuccess('');

        try {
            const result = await redeemMutation.mutateAsync({ code });
            setRedeemSuccess(`"${result.coupon.name}" 쿠폰이 등록되었습니다!`);
            setPromoCode('');
        } catch (err: any) {
            const msg = err?.response?.data?.message || err?.message || '쿠폰 등록에 실패했습니다.';
            setRedeemError(Array.isArray(msg) ? msg[0] : msg);
        }
    };

    return (
        <main className="min-h-screen bg-gray-50 pb-8">
            <header className="sticky top-0 z-50 bg-white border-b border-gray-100">
                <div className="flex items-center gap-3 px-4 h-14">
                    <button
                        onClick={() => router.back()}
                        className="p-2 -ml-2 text-brand-black"
                        aria-label="뒤로가기"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <h1 className="font-bold text-lg">내 쿠폰함</h1>
                </div>
            </header>

            <div className="max-w-[568px] mx-auto p-4 space-y-4">
                {/* 프로모 코드 입력 */}
                <section className="bg-white rounded-xl p-4">
                    <h2 className="font-bold text-base mb-3">프로모 코드 등록</h2>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={promoCode}
                            onChange={(e) => {
                                setPromoCode(e.target.value.toUpperCase());
                                setRedeemError('');
                                setRedeemSuccess('');
                            }}
                            onKeyDown={(e) => e.key === 'Enter' && handleRedeem()}
                            placeholder="코드를 입력하세요"
                            className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-purple-400"
                        />
                        <button
                            onClick={handleRedeem}
                            disabled={!promoCode.trim() || redeemMutation.isPending}
                            className="bg-purple-600 text-white px-4 py-2 rounded-lg text-sm font-semibold disabled:opacity-50"
                        >
                            {redeemMutation.isPending ? '등록 중...' : '등록'}
                        </button>
                    </div>
                    {redeemError && (
                        <p className="text-xs text-red-500 mt-2">{redeemError}</p>
                    )}
                    {redeemSuccess && (
                        <p className="text-xs text-purple-600 font-semibold mt-2">{redeemSuccess}</p>
                    )}
                </section>

                {/* 사용 가능한 쿠폰 */}
                <section>
                    <div className="flex items-center gap-2 mb-3">
                        <Ticket size={16} className="text-purple-500" />
                        <h2 className="font-bold text-base">사용 가능 ({activeCoupons.length}장)</h2>
                    </div>
                    {isLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map((i) => (
                                <div key={i} className="bg-white rounded-xl h-24 animate-pulse" />
                            ))}
                        </div>
                    ) : activeCoupons.length === 0 ? (
                        <div className="bg-white rounded-xl p-8 text-center text-gray-400">
                            <Ticket size={32} className="mx-auto mb-2 text-gray-300" />
                            <p className="text-sm">사용 가능한 쿠폰이 없습니다</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeCoupons.map((uc) => (
                                <CouponCard key={uc.id} uc={uc} />
                            ))}
                        </div>
                    )}
                </section>

                {/* 사용/만료 쿠폰 */}
                {usedOrExpiredCoupons.length > 0 && (
                    <section>
                        <h2 className="font-bold text-base text-gray-400 mb-3">
                            사용/만료 ({usedOrExpiredCoupons.length}장)
                        </h2>
                        <div className="space-y-3">
                            {usedOrExpiredCoupons.map((uc) => (
                                <CouponCard key={uc.id} uc={uc} />
                            ))}
                        </div>
                    </section>
                )}
            </div>
        </main>
    );
}
