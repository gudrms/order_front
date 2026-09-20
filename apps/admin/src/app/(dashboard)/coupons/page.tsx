'use client';

import { useState, type FormEvent, type InputHTMLAttributes } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { Coupon } from '@order/shared';
import { Copy, RefreshCw } from 'lucide-react';
import { useAdminStore } from '@/contexts/AdminStoreContext';
import { adminApi } from '@/lib/adminApi';
import { getHttpErrorMessage } from '@/lib/httpError';

type AdminCoupon = Coupon & { maxUses: number | null; usedCount: number };
type Feedback = { type: 'success' | 'error'; message: string };
const API_URL = process.env.NEXT_PUBLIC_API_URL;
const queryKey = ['admin-coupons'];
const initialForm = {
  name: '', description: '', code: '', type: 'FIXED_AMOUNT' as Coupon['type'],
  discountValue: '', maxDiscountAmount: '5000', minOrderAmount: '', maxUses: '', defaultExpiryDays: '30',
};
const inputClass = 'w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none';
const buttonClass = 'rounded-md border border-gray-300 px-3 py-2 text-sm font-medium hover:bg-gray-50 disabled:opacity-50';
const primaryClass = 'rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50';
const number = (value: number) => value.toLocaleString('ko-KR');

function Field({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return <label className="block space-y-1 text-sm text-gray-700"><span>{label}</span><input className={inputClass} {...props} /></label>;
}

export default function CouponsPage() {
  const { authHeaders } = useAdminStore();
  const queryClient = useQueryClient();
  const [form, setForm] = useState(initialForm);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [issuingId, setIssuingId] = useState<string | null>(null);
  const [userId, setUserId] = useState('');
  const [expiryDays, setExpiryDays] = useState('');
  const couponsQuery = useQuery<AdminCoupon[]>({
    queryKey,
    queryFn: async () => (await adminApi.get(`${API_URL}/coupons`, { headers: authHeaders })).data,
    enabled: !!authHeaders,
  });
  const invalidate = () => { void queryClient.invalidateQueries({ queryKey }); };
  const createMutation = useMutation({
    mutationFn: async () => adminApi.post(`${API_URL}/coupons`, {
      name: form.name.trim(), description: form.description.trim() || undefined,
      code: form.code.trim() || undefined, type: form.type, discountValue: Number(form.discountValue),
      maxDiscountAmount: form.type === 'PERCENTAGE' ? Number(form.maxDiscountAmount) : undefined,
      minOrderAmount: form.minOrderAmount === '' ? undefined : Number(form.minOrderAmount),
      maxUses: form.maxUses === '' ? undefined : Number(form.maxUses),
      defaultExpiryDays: Number(form.defaultExpiryDays),
    }, { headers: authHeaders }),
    onSuccess: () => {
      setForm(initialForm);
      setFeedback({ type: 'success', message: '쿠폰을 생성했습니다.' });
      invalidate();
    },
    onError: (error) => setFeedback({ type: 'error', message: getHttpErrorMessage(error, '쿠폰 생성에 실패했습니다.') }),
  });
  const issueMutation = useMutation({
    mutationFn: async ({ couponId, recipient, days }: { couponId: string; recipient: string; days: string }) =>
      adminApi.post(`${API_URL}/coupons/${couponId}/issue`, {
        userId: recipient, expiryDays: days === '' ? undefined : Number(days),
      }, { headers: authHeaders }),
    onSuccess: () => {
      setIssuingId(null);
      setUserId('');
      setExpiryDays('');
      setFeedback({ type: 'success', message: '사용자에게 쿠폰을 발급했습니다.' });
      invalidate();
    },
    onError: (error) => setFeedback({ type: 'error', message: getHttpErrorMessage(error, '쿠폰 발급에 실패했습니다.') }),
  });
  function submitCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!authHeaders || createMutation.isPending) return;
    setFeedback(null);
    if (!form.name.trim()) {
      setFeedback({ type: 'error', message: '쿠폰 이름을 입력해주세요.' });
      return;
    }
    createMutation.mutate();
  }
  async function copyCode(code: string) {
    try {
      await navigator.clipboard.writeText(code);
      setFeedback({ type: 'success', message: '프로모 코드를 복사했습니다.' });
    } catch {
      setFeedback({ type: 'error', message: '복사하지 못했습니다. 프로모 코드를 직접 선택해 복사해주세요.' });
    }
  }
  const bind = (key: keyof typeof initialForm) => ({
    value: form[key], onChange: (event: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, [key]: event.target.value })),
  });

  return (
    <div className="space-y-6" data-testid="admin-coupons-page">
      <div className="flex items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold text-gray-900">쿠폰 관리</h1><p className="mt-1 text-sm text-gray-500">쿠폰을 생성하고 고객에게 발급합니다.</p></div>
        <button type="button" className={`${buttonClass} inline-flex items-center gap-2`} disabled={!authHeaders || couponsQuery.isFetching} onClick={() => void couponsQuery.refetch()}><RefreshCw className="h-4 w-4" />새로고침</button>
      </div>
      <div className="rounded-md border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
        할인과 최소 주문금액은 배달비를 제외한 상품 금액 기준입니다. 최소 주문금액은 매장 최소 주문금액 이상으로 설정하세요. 비용을 예측하기 쉬운 정액 할인을 권장합니다.
      </div>
      {feedback && <div role={feedback.type === 'error' ? 'alert' : 'status'} className={`rounded-md border p-4 text-sm ${feedback.type === 'error' ? 'border-red-200 bg-red-50 text-red-800' : 'border-green-200 bg-green-50 text-green-800'}`}>{feedback.message}</div>}
      <section className="grid items-start gap-6 lg:grid-cols-[360px_1fr]">
        <form onSubmit={submitCreate} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
          <fieldset disabled={!authHeaders || createMutation.isPending} className="space-y-4">
            <legend className="mb-4 text-lg font-semibold text-gray-900">새 쿠폰 생성</legend>
            <Field label="쿠폰 이름 *" required {...bind('name')} />
            <Field label="설명" {...bind('description')} />
            <label className="block space-y-1 text-sm text-gray-700"><span>할인 타입</span><select className={inputClass} value={form.type} onChange={(event) => setForm((prev) => ({ ...prev, type: event.target.value as Coupon['type'] }))}><option value="FIXED_AMOUNT">정액 할인</option><option value="PERCENTAGE">정률 할인</option></select></label>
            <Field label={`할인값 (${form.type === 'PERCENTAGE' ? '%' : '원'}) *`} type="number" min={1} max={form.type === 'PERCENTAGE' ? 100 : undefined} step={1} required {...bind('discountValue')} />
            {form.type === 'PERCENTAGE' && <Field label="정률 할인 상한 (원) *" type="number" min={1} step={1} required {...bind('maxDiscountAmount')} />}
            <Field label="최소 주문금액 (원)" type="number" min={0} step={1} {...bind('minOrderAmount')} />
            <Field label="총 발급 한도" type="number" min={1} step={1} placeholder="미입력 시 무제한" {...bind('maxUses')} />
            <Field label="유효기간 (일) *" type="number" min={1} max={365} step={1} required {...bind('defaultExpiryDays')} />
            <Field label="프로모 코드" {...bind('code')} />
            <p className="text-xs text-gray-500">코드가 있으면 고객이 직접 등록할 수 있습니다. 미입력 시 관리자 직접 발급 전용입니다.</p>
            <button type="submit" className={`${primaryClass} w-full`}>{createMutation.isPending ? '생성 중…' : '쿠폰 생성'}</button>
          </fieldset>
        </form>
        <div className="min-w-0 space-y-4">
          <h2 className="text-lg font-semibold text-gray-900">쿠폰 목록</h2>
          {couponsQuery.isError ? (
            <div role="alert" data-testid="admin-coupons-fetch-error" className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-800">
              <p>{getHttpErrorMessage(couponsQuery.error, '쿠폰 목록을 불러오지 못했습니다.')}</p>
              <button type="button" className={`${buttonClass} mt-3`} disabled={couponsQuery.isFetching} onClick={() => void couponsQuery.refetch()}>다시 시도</button>
            </div>
          ) : couponsQuery.isPending ? <p role="status" className="text-sm text-gray-500">쿠폰 목록을 불러오는 중…</p>
            : couponsQuery.data.length === 0 ? <p className="rounded-lg border bg-white p-8 text-center text-sm text-gray-500">등록된 쿠폰이 없습니다.</p>
              : couponsQuery.data.map((coupon) => (
                <article key={coupon.id} className="space-y-3 rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start justify-between gap-3"><h3 className="break-words font-semibold text-gray-900">{coupon.name}</h3><span className={`shrink-0 rounded-full px-2 py-1 text-xs ${coupon.isActive ? 'bg-green-50 text-green-700' : 'bg-gray-100 text-gray-500'}`}>{coupon.isActive ? '활성' : '비활성'}</span></div>
                  {coupon.description && <p className="break-words text-sm text-gray-500">{coupon.description}</p>}
                  <p className="font-semibold text-blue-700">{coupon.type === 'PERCENTAGE' ? `${number(coupon.discountValue)}% 할인 (${coupon.maxDiscountAmount == null ? '상한 미설정' : `최대 ${number(coupon.maxDiscountAmount)}원`})` : `${number(coupon.discountValue)}원 할인`}</p>
                  <div className="space-y-1 text-sm text-gray-600">
                    <p>최소 주문금액: {coupon.minOrderAmount ? `${number(coupon.minOrderAmount)}원` : '없음'}</p>
                    <p>사용 현황: {number(coupon.usedCount)} / {coupon.maxUses == null ? '무제한' : number(coupon.maxUses)}</p>
                    <p>유효기간: 발급일부터 {coupon.defaultExpiryDays}일</p>
                    <p>생성일: {new Date(coupon.createdAt).toLocaleDateString('ko-KR', { timeZone: 'Asia/Seoul' })}</p>
                  </div>
                  {coupon.code && <div className="flex items-center gap-2 text-sm"><code className="break-all rounded bg-gray-100 px-2 py-1">{coupon.code}</code><button type="button" className={buttonClass} aria-label={`${coupon.name} 프로모 코드 복사`} onClick={() => void copyCode(coupon.code!)}><Copy className="h-4 w-4" /></button></div>}
                  {issuingId === coupon.id ? (
                    <form className="border-t pt-4" onSubmit={(event) => {
                      event.preventDefault();
                      if (!authHeaders || issueMutation.isPending || !userId.trim() || !coupon.isActive) return;
                      setFeedback(null);
                      issueMutation.mutate({ couponId: coupon.id, recipient: userId.trim(), days: expiryDays });
                    }}>
                      <fieldset disabled={issueMutation.isPending || !authHeaders || !coupon.isActive} className="space-y-3">
                        <legend className="mb-3 text-sm font-semibold">{coupon.name} 발급</legend>
                        <Field label="사용자 ID *" required value={userId} onChange={(event) => setUserId(event.target.value)} />
                        <p className="text-xs text-gray-500">고객의 사용자 ID를 입력하세요. 이메일이나 전화번호로는 발급되지 않습니다.</p>
                        <Field label="발급 유효기간 (일)" type="number" min={1} step={1} placeholder={`미입력 시 ${coupon.defaultExpiryDays}일`} value={expiryDays} onChange={(event) => setExpiryDays(event.target.value)} />
                        <div className="flex gap-2"><button type="submit" disabled={!userId.trim()} className={primaryClass}>{issueMutation.isPending ? '발급 중…' : '발급 확인'}</button><button type="button" className={buttonClass} onClick={() => setIssuingId(null)}>취소</button></div>
                      </fieldset>
                    </form>
                  ) : <button type="button" className={buttonClass} disabled={!coupon.isActive || !authHeaders || issueMutation.isPending} onClick={() => { setIssuingId(coupon.id); setUserId(''); setExpiryDays(''); setFeedback(null); }}>발급</button>}
                </article>
              ))}
        </div>
      </section>
    </div>
  );
}
