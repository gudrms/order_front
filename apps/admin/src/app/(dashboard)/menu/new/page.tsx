'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { supabase, getPublicUrl } from '@/lib/supabase';
import axios from 'axios';
import { Image as ImageIcon, Loader2 } from 'lucide-react';

export default function NewMenuPage() {
  const router = useRouter();
  const { session } = useAuth();
  
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState('MAIN');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  // 이미지 파일 선택 핸들러
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 유효성 검사 (5MB 제한)
    if (file.size > 5 * 1024 * 1024) {
      alert('이미지는 5MB 이하여야 합니다.');
      return;
    }

    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      let imageUrl = null;

      // 1. 이미지 업로드 (Supabase Storage)
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `menu_${Date.now()}_${Math.random().toString(36).substring(2)}.${fileExt}`;
        const filePath = `menus/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('assets') // 'assets' 버킷 사용
          .upload(filePath, imageFile);

        if (uploadError) throw uploadError;

        // 2. 업로드된 이미지의 Public URL 가져오기
        imageUrl = getPublicUrl(filePath);
      }

      // 3. 백엔드 API에 메뉴 정보 저장
      await axios.post(
        `${process.env.NEXT_PUBLIC_API_URL}/menus`,
        {
          name,
          description,
          price: Number(price),
          category,
          imageUrl,
          soldOut: false,
        },
        {
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      alert('메뉴가 성공적으로 등록되었습니다.');
      router.push('/menu');
    } catch (error) {
      console.error('메뉴 등록 실패:', error);
      alert('메뉴 등록 중 오류가 발생했습니다.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">새 메뉴 등록</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        {/* 이미지 업로드 섹션 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">메뉴 이미지</label>
          <div className="flex items-center gap-4">
            <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center border border-gray-200 relative">
              {previewUrl ? (
                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
              ) : (
                <ImageIcon className="w-8 h-8 text-gray-400" />
              )}
            </div>
            <div className="flex-1">
              <input
                type="file"
                accept="image/png, image/jpeg, image/jpg, image/webp"
                onChange={handleImageChange}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-full file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                "
              />
              <p className="mt-1 text-xs text-gray-500">
                JPG, PNG, WebP (최대 5MB)
              </p>
            </div>
          </div>
        </div>

        {/* 기본 정보 섹션 */}
        <div className="grid grid-cols-1 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              메뉴 이름 <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="name"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 국물 떡볶이"
            />
          </div>

          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
              카테고리 <span className="text-red-500">*</span>
            </label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="MAIN">메인 메뉴</option>
              <option value="SIDE">사이드 메뉴</option>
              <option value="DRINK">음료/주류</option>
              <option value="TOPPING">토핑</option>
            </select>
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">
              가격 (원) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              id="price"
              required
              min="0"
              step="100"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="예: 15000"
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              상세 설명
            </label>
            <textarea
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="메뉴에 대한 설명을 입력해주세요."
            />
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={() => router.back()}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={isUploading}
            className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:bg-blue-400 transition-colors"
          >
            {isUploading && <Loader2 className="w-4 h-4 animate-spin" />}
            {isUploading ? '저장 중...' : '메뉴 등록'}
          </button>
        </div>
      </form>
    </div>
  );
}
