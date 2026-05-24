'use client';

import { FormEvent, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { Plus, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useAdminStore } from '@/contexts/AdminStoreContext';
import { getHttpErrorMessage } from '@/lib/httpError';
import { MenuImageUpload } from '@/components/MenuImageUpload';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

type BrandBanner = {
  id: string;
  title: string;
  subtitle?: string | null;
  badge?: string | null;
  bgType: string;
  bgStartColor?: string | null;
  bgEndColor?: string | null;
  imageUrl?: string | null;
  linkType: string;
  linkUrl?: string | null;
  storeId?: string | null;
  displayOrder: number;
  isActive: boolean;
};

type StoreItem = {
  id: string;
  name: string;
  storeType: string;
  branchId: string;
  branchName?: string;
};

type Feedback = {
  type: 'success' | 'error';
  message: string;
};

const GRADIENT_PRESETS = [
  { name: '골든 오렌지 (기본 노랑)', start: '#F5A623', end: '#F05A28' },
  { name: '에메랄드 포레스트 (기본 초록)', start: '#10B981', end: '#047857' },
  { name: '다크 시그니처 (기본 검정)', start: '#1F2937', end: '#111827' },
  { name: '로맨틱 로즈 (핑크)', start: '#EC4899', end: '#E11D48' },
  { name: '오션 스카이 (블루)', start: '#3B82F6', end: '#4F46E5' },
  { name: '선셋 퍼플 (보라)', start: '#8B5CF6', end: '#4338CA' },
];

export default function BannersPage() {
  const queryClient = useQueryClient();
  const { authHeaders } = useAdminStore();
  const [feedback, setFeedback] = useState<Feedback | null>(null);

  const [bannerForm, setBannerForm] = useState({
    title: '',
    subtitle: '',
    badge: '',
    bgType: 'GRADIENT',
    bgStartColor: GRADIENT_PRESETS[0].start,
    bgEndColor: GRADIENT_PRESETS[0].end,
    imageUrl: '',
    linkType: 'NONE',
    linkUrl: '',
    storeId: '',
    displayOrder: '0',
  });

  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({
    title: '',
    subtitle: '',
    badge: '',
    bgType: 'GRADIENT',
    bgStartColor: '',
    bgEndColor: '',
    imageUrl: '',
    linkType: 'NONE',
    linkUrl: '',
    storeId: '',
    displayOrder: '0',
  });

  const bannersQuery = useQuery<BrandBanner[]>({
    queryKey: ['brand-banners-admin'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/brand-banners/admin`, {
        headers: authHeaders,
      });
      return response.data;
    },
    enabled: !!authHeaders,
  });

  const storesQuery = useQuery<StoreItem[]>({
    queryKey: ['stores-admin-list'],
    queryFn: async () => {
      const response = await axios.get(`${API_URL}/stores`, {
        headers: authHeaders,
      });
      return response.data.data || response.data;
    },
    enabled: !!authHeaders,
  });

  const banners = bannersQuery.data || [];
  const stores = storesQuery.data || [];

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['brand-banners-admin'] });
  };

  const createBannerMutation = useMutation({
    mutationFn: async () => {
      await axios.post(
        `${API_URL}/brand-banners/admin`,
        {
          title: bannerForm.title.trim(),
          subtitle: bannerForm.subtitle.trim() || undefined,
          badge: bannerForm.badge.trim() || undefined,
          bgType: bannerForm.bgType,
          bgStartColor: bannerForm.bgType === 'GRADIENT' ? bannerForm.bgStartColor : undefined,
          bgEndColor: bannerForm.bgType === 'GRADIENT' ? bannerForm.bgEndColor : undefined,
          imageUrl: bannerForm.bgType === 'IMAGE' ? bannerForm.imageUrl.trim() : undefined,
          linkType: bannerForm.linkType,
          linkUrl: bannerForm.linkType === 'EXTERNAL' ? bannerForm.linkUrl.trim() : undefined,
          storeId: bannerForm.linkType === 'STORE' ? bannerForm.storeId : undefined,
          displayOrder: Number(bannerForm.displayOrder) || 0,
        },
        { headers: authHeaders },
      );
    },
    onSuccess: () => {
      setBannerForm({
        title: '',
        subtitle: '',
        badge: '',
        bgType: 'GRADIENT',
        bgStartColor: GRADIENT_PRESETS[0].start,
        bgEndColor: GRADIENT_PRESETS[0].end,
        imageUrl: '',
        linkType: 'NONE',
        linkUrl: '',
        storeId: '',
        displayOrder: '0',
      });
      setFeedback({ type: 'success', message: '새 배너를 추가했습니다.' });
      invalidate();
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getHttpErrorMessage(error, '배너 추가에 실패했습니다.') });
    },
  });

  const updateBannerMutation = useMutation({
    mutationFn: async () => {
      if (!editingBannerId) return;
      await axios.patch(
        `${API_URL}/brand-banners/admin/${editingBannerId}`,
        {
          title: editForm.title.trim(),
          subtitle: editForm.subtitle.trim() || null,
          badge: editForm.badge.trim() || null,
          bgType: editForm.bgType,
          bgStartColor: editForm.bgType === 'GRADIENT' ? editForm.bgStartColor : null,
          bgEndColor: editForm.bgType === 'GRADIENT' ? editForm.bgEndColor : null,
          imageUrl: editForm.bgType === 'IMAGE' ? editForm.imageUrl.trim() : null,
          linkType: editForm.linkType,
          linkUrl: editForm.linkType === 'EXTERNAL' ? editForm.linkUrl.trim() : null,
          storeId: editForm.linkType === 'STORE' ? editForm.storeId : null,
          displayOrder: Number(editForm.displayOrder) || 0,
        },
        { headers: authHeaders },
      );
    },
    onSuccess: () => {
      setEditingBannerId(null);
      setFeedback({ type: 'success', message: '배너 정보를 수정했습니다.' });
      invalidate();
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getHttpErrorMessage(error, '배너 수정에 실패했습니다.') });
    },
  });

  const toggleBannerMutation = useMutation({
    mutationFn: async (banner: BrandBanner) => {
      await axios.patch(
        `${API_URL}/brand-banners/admin/${banner.id}`,
        { isActive: !banner.isActive },
        { headers: authHeaders },
      );
    },
    onSuccess: invalidate,
    onError: (error) => {
      setFeedback({ type: 'error', message: getHttpErrorMessage(error, '배너 노출 상태 변경에 실패했습니다.') });
    },
  });

  const deleteBannerMutation = useMutation({
    mutationFn: async (bannerId: string) => {
      await axios.delete(`${API_URL}/brand-banners/admin/${bannerId}`, {
        headers: authHeaders,
      });
    },
    onSuccess: () => {
      setFeedback({ type: 'success', message: '배너를 삭제했습니다.' });
      invalidate();
    },
    onError: (error) => {
      setFeedback({ type: 'error', message: getHttpErrorMessage(error, '배너 삭제에 실패했습니다.') });
    },
  });

  const startEdit = (banner: BrandBanner) => {
    setEditingBannerId(banner.id);
    setEditForm({
      title: banner.title,
      subtitle: banner.subtitle || '',
      badge: banner.badge || '',
      bgType: banner.bgType,
      bgStartColor: banner.bgStartColor || GRADIENT_PRESETS[0].start,
      bgEndColor: banner.bgEndColor || GRADIENT_PRESETS[0].end,
      imageUrl: banner.imageUrl || '',
      linkType: banner.linkType,
      linkUrl: banner.linkUrl || '',
      storeId: banner.storeId || '',
      displayOrder: String(banner.displayOrder),
    });
  };

  const handleCreateBanner = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!bannerForm.title.trim()) return;
    createBannerMutation.mutate();
  };

  const handleUpdateBanner = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editForm.title.trim()) return;
    updateBannerMutation.mutate();
  };

  const selectPreset = (start: string, end: string, isEdit: boolean) => {
    if (isEdit) {
      setEditForm((prev) => ({ ...prev, bgStartColor: start, bgEndColor: end }));
    } else {
      setBannerForm((prev) => ({ ...prev, bgStartColor: start, bgEndColor: end }));
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">배너 관리</h1>
          <p className="mt-1 text-sm text-gray-500">
            배달앱 메인 화면 상단에 롤링되는 마케팅 배너 리스트를 관리합니다.
          </p>
        </div>
        <button
          type="button"
          onClick={() => bannersQuery.refetch()}
          className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCw className="mr-2 h-4 w-4" />
          새로고침
        </button>
      </div>

      {feedback && (
        <div
          className={`rounded-md border px-4 py-3 text-sm ${
            feedback.type === 'success'
              ? 'border-green-200 bg-green-50 text-green-800'
              : 'border-red-200 bg-red-50 text-red-800'
          }`}
        >
          {feedback.message}
        </div>
      )}

      <section className="grid gap-6 lg:grid-cols-[380px_1fr]">
        {/* 생성 및 미리보기 영역 */}
        <div className="space-y-6">
          <form onSubmit={handleCreateBanner} className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">새 배너 추가</h2>
            
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">메인 제목 *</label>
                <input
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm((prev) => ({ ...prev, title: e.target.value }))}
                  placeholder="예: 타코몰리 첫 배달 무료!"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">서브 타이틀</label>
                <input
                  value={bannerForm.subtitle}
                  onChange={(e) => setBannerForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                  placeholder="예: 3,000원 쿠폰팩 즉시 지급"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">뱃지 문구</label>
                <input
                  value={bannerForm.badge}
                  onChange={(e) => setBannerForm((prev) => ({ ...prev, badge: e.target.value }))}
                  placeholder="예: 기간한정, 꿀혜택, NEW"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">배경 타입</label>
                <select
                  value={bannerForm.bgType}
                  onChange={(e) => setBannerForm((prev) => ({ ...prev, bgType: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                >
                  <option value="GRADIENT">그라데이션 색상</option>
                  <option value="IMAGE">실사 이미지</option>
                </select>
              </div>

              {bannerForm.bgType === 'GRADIENT' ? (
                <div className="space-y-2">
                  <div>
                    <label className="block text-xs font-bold text-gray-500 mb-1">추천 프리셋 선택</label>
                    <select
                      onChange={(e) => {
                        if (!e.target.value) return;
                        const [start, end] = e.target.value.split('|');
                        selectPreset(start, end, false);
                      }}
                      className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                    >
                      <option value="">-- 프리셋 색상 선택 --</option>
                      {GRADIENT_PRESETS.map((p) => (
                        <option key={p.name} value={`${p.start}|${p.end}`}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">시작 색상 HEX</label>
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="color"
                          value={bannerForm.bgStartColor}
                          onChange={(e) => setBannerForm((prev) => ({ ...prev, bgStartColor: e.target.value }))}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={bannerForm.bgStartColor}
                          onChange={(e) => setBannerForm((prev) => ({ ...prev, bgStartColor: e.target.value }))}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs font-mono uppercase focus:outline-none"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-400 mb-1">종료 색상 HEX</label>
                      <div className="flex gap-1.5 items-center">
                        <input
                          type="color"
                          value={bannerForm.bgEndColor}
                          onChange={(e) => setBannerForm((prev) => ({ ...prev, bgEndColor: e.target.value }))}
                          className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                        />
                        <input
                          type="text"
                          value={bannerForm.bgEndColor}
                          onChange={(e) => setBannerForm((prev) => ({ ...prev, bgEndColor: e.target.value }))}
                          className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs font-mono uppercase focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">배너 배경 이미지 *</label>
                  <MenuImageUpload
                    uploadUrl={`${API_URL}/brand-banners/admin/image`}
                    value={bannerForm.imageUrl}
                    onChange={(imageUrl) => setBannerForm((prev) => ({ ...prev, imageUrl }))}
                    authHeaders={authHeaders}
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">클릭 이동 대상</label>
                <select
                  value={bannerForm.linkType}
                  onChange={(e) => setBannerForm((prev) => ({ ...prev, linkType: e.target.value }))}
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                >
                  <option value="NONE">이동 없음 (단순 노출)</option>
                  <option value="STORE">특정 매장 연동</option>
                  <option value="EXTERNAL">외부 링크 주소</option>
                </select>
              </div>

              {bannerForm.linkType === 'STORE' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">연동할 매장 선택 *</label>
                  <select
                    value={bannerForm.storeId}
                    onChange={(e) => setBannerForm((prev) => ({ ...prev, storeId: e.target.value }))}
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                    required
                  >
                    <option value="">매장을 선택해 주세요</option>
                    {stores.map((s) => (
                      <option key={s.id} value={s.id}>{s.name} ({s.branchName})</option>
                    ))}
                  </select>
                </div>
              )}

              {bannerForm.linkType === 'EXTERNAL' && (
                <div>
                  <label className="block text-xs font-bold text-gray-500 mb-1">연동 링크 주소 *</label>
                  <input
                    value={bannerForm.linkUrl}
                    onChange={(e) => setBannerForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
                    placeholder="https://example.com/promo"
                    className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">정렬 순서 (작을수록 상단)</label>
                <input
                  value={bannerForm.displayOrder}
                  onChange={(e) => setBannerForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
                  inputMode="numeric"
                  className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={createBannerMutation.isPending}
              className="inline-flex w-full items-center justify-center rounded-md bg-blue-600 px-3 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
            >
              <Plus className="mr-2 h-4 w-4" />
              배너 추가
            </button>
          </form>

          {/* 배너 미리보기 */}
          <div className="rounded-lg border border-gray-200 bg-white p-5 shadow-sm">
            <h3 className="text-sm font-bold text-gray-500 mb-3 uppercase tracking-wider">배달앱 노출 미리보기</h3>
            <div className="relative w-full aspect-[2/1] rounded-2xl overflow-hidden shadow-inner">
              <div
                className="w-full h-full p-6 flex flex-col items-start justify-end text-left relative overflow-hidden"
                style={
                  bannerForm.bgType === 'GRADIENT'
                    ? { background: `linear-gradient(135deg, ${bannerForm.bgStartColor}, ${bannerForm.bgEndColor})` }
                    : bannerForm.bgType === 'IMAGE' && bannerForm.imageUrl
                    ? { backgroundImage: `url(${bannerForm.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                    : { backgroundColor: '#F3F4F6' }
                }
              >
                {bannerForm.badge && (
                  <span className="text-[10px] font-bold bg-white/20 text-white px-2 py-0.5 rounded-full mb-1">
                    {bannerForm.badge}
                  </span>
                )}
                {bannerForm.subtitle && (
                  <p className="text-white/80 text-xs mb-0.5">{bannerForm.subtitle}</p>
                )}
                <h4 className="text-white text-lg font-black leading-tight">
                  {bannerForm.title || '배너 제목을 입력해 주세요'}
                </h4>
              </div>
            </div>
          </div>
        </div>

        {/* 배너 리스트 목록 */}
        <div className="rounded-lg border border-gray-200 bg-white shadow-sm h-fit">
          <div className="border-b border-gray-200 px-5 py-4 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900">등록된 마케팅 배너 ({banners.length})</h2>
          </div>

          <div className="divide-y divide-gray-100">
            {bannersQuery.isLoading && (
              <p className="px-5 py-8 text-center text-sm text-gray-500 animate-pulse">데이터 로드 중입니다...</p>
            )}
            {!bannersQuery.isLoading && banners.length === 0 && (
              <p className="px-5 py-8 text-center text-sm text-gray-500">등록된 마케팅 배너가 없습니다.</p>
            )}

            {banners.map((banner) =>
              editingBannerId === banner.id ? (
                <form key={banner.id} onSubmit={handleUpdateBanner} className="space-y-4 bg-gray-50 px-5 py-5">
                  <h3 className="text-sm font-semibold text-gray-900 border-b pb-2">배너 수정</h3>
                  
                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">메인 제목 *</label>
                      <input
                        value={editForm.title}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, title: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">서브 타이틀</label>
                      <input
                        value={editForm.subtitle}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, subtitle: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">뱃지 문구</label>
                      <input
                        value={editForm.badge}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, badge: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">배경 타입</label>
                      <select
                        value={editForm.bgType}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, bgType: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                      >
                        <option value="GRADIENT">그라데이션 색상</option>
                        <option value="IMAGE">실사 이미지</option>
                      </select>
                    </div>
                  </div>

                  {editForm.bgType === 'GRADIENT' ? (
                    <div className="space-y-2">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">추천 프리셋 선택</label>
                        <select
                          onChange={(e) => {
                            if (!e.target.value) return;
                            const [start, end] = e.target.value.split('|');
                            selectPreset(start, end, true);
                          }}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                        >
                          <option value="">-- 프리셋 색상 선택 --</option>
                          {GRADIENT_PRESETS.map((p) => (
                            <option key={p.name} value={`${p.start}|${p.end}`}>{p.name}</option>
                          ))}
                        </select>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">시작 색상 HEX</label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="color"
                              value={editForm.bgStartColor}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, bgStartColor: e.target.value }))}
                              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editForm.bgStartColor}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, bgStartColor: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs font-mono uppercase focus:outline-none"
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-gray-400 mb-1">종료 색상 HEX</label>
                          <div className="flex gap-1.5 items-center">
                            <input
                              type="color"
                              value={editForm.bgEndColor}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, bgEndColor: e.target.value }))}
                              className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
                            />
                            <input
                              type="text"
                              value={editForm.bgEndColor}
                              onChange={(e) => setEditForm((prev) => ({ ...prev, bgEndColor: e.target.value }))}
                              className="w-full rounded border border-gray-300 px-2 py-1.5 text-xs font-mono uppercase focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">배너 배경 이미지 *</label>
                      <MenuImageUpload
                        uploadUrl={`${API_URL}/brand-banners/admin/image`}
                        value={editForm.imageUrl}
                        onChange={(imageUrl) => setEditForm((prev) => ({ ...prev, imageUrl }))}
                        authHeaders={authHeaders}
                      />
                    </div>
                  )}

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">클릭 이동 대상</label>
                      <select
                        value={editForm.linkType}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, linkType: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                      >
                        <option value="NONE">이동 없음 (단순 노출)</option>
                        <option value="STORE">특정 매장 연동</option>
                        <option value="EXTERNAL">외부 링크 주소</option>
                      </select>
                    </div>

                    {editForm.linkType === 'STORE' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">연동할 매장 선택 *</label>
                        <select
                          value={editForm.storeId}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, storeId: e.target.value }))}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                          required
                        >
                          <option value="">매장을 선택해 주세요</option>
                          {stores.map((s) => (
                            <option key={s.id} value={s.id}>{s.name} ({s.branchName})</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {editForm.linkType === 'EXTERNAL' && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 mb-1">연동 링크 주소 *</label>
                        <input
                          value={editForm.linkUrl}
                          onChange={(e) => setEditForm((prev) => ({ ...prev, linkUrl: e.target.value }))}
                          className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                          required
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-xs font-bold text-gray-500 mb-1">정렬 순서</label>
                      <input
                        value={editForm.displayOrder}
                        onChange={(e) => setEditForm((prev) => ({ ...prev, displayOrder: e.target.value }))}
                        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-900 focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="submit"
                      disabled={updateBannerMutation.isPending}
                      className="inline-flex items-center justify-center rounded-md bg-blue-600 px-3.5 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-50"
                    >
                      <Save className="mr-2 h-4 w-4" />
                      저장
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBannerId(null)}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      취소
                    </button>
                  </div>
                </form>
              ) : (
                <div key={banner.id} className="flex flex-col gap-4 px-5 py-4 md:flex-row md:items-center md:justify-between hover:bg-gray-50 transition-colors">
                  <div className="flex items-center gap-4">
                    {/* 배너 미니어처 */}
                    <div className="w-24 aspect-[2/1] rounded-lg overflow-hidden shrink-0 border border-gray-200 relative select-none">
                      <div
                        className="w-full h-full p-2 flex flex-col items-start justify-end text-left relative overflow-hidden"
                        style={
                          banner.bgType === 'GRADIENT'
                            ? { background: `linear-gradient(135deg, ${banner.bgStartColor}, ${banner.bgEndColor})` }
                            : banner.bgType === 'IMAGE' && banner.imageUrl
                            ? { backgroundImage: `url(${banner.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }
                            : { backgroundColor: '#F3F4F6' }
                        }
                      >
                        <span className="text-[6px] text-white/90 font-bold truncate block w-full drop-shadow-sm">{banner.title}</span>
                      </div>
                    </div>

                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-semibold text-gray-900 text-base">{banner.title}</h3>
                        {banner.badge && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-bold text-blue-800">{banner.badge}</span>
                        )}
                        {!banner.isActive && (
                          <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-500">숨김</span>
                        )}
                      </div>
                      <p className="mt-1 text-sm text-gray-500">
                        {banner.subtitle ? `${banner.subtitle} · ` : ''}
                        정렬: {banner.displayOrder} · {
                          banner.linkType === 'NONE'
                            ? '클릭 액션 없음'
                            : banner.linkType === 'STORE'
                            ? `매장 연결: ${stores.find((st) => st.id === banner.storeId)?.name || '지정되지 않음'}`
                            : `외부 주소 연결: ${banner.linkUrl}`
                        }
                      </p>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => startEdit(banner)}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      수정
                    </button>
                    <button
                      type="button"
                      onClick={() => toggleBannerMutation.mutate(banner)}
                      className="inline-flex items-center justify-center rounded-md border border-gray-300 px-3.5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      {banner.isActive ? '숨기기' : '노출하기'}
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm('정말로 이 배너를 삭제하시겠습니까?')) {
                          deleteBannerMutation.mutate(banner.id);
                        }
                      }}
                      disabled={deleteBannerMutation.isPending}
                      className="inline-flex items-center justify-center rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                      title="삭제"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ),
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
