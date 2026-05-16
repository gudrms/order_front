'use client';

import React, { useRef, useState } from 'react';
import axios from 'axios';
import imageCompression from 'browser-image-compression';
import { ImagePlus, Loader2, X } from 'lucide-react';
import { getHttpErrorMessage } from '@/lib/httpError';

const API_URL = process.env.NEXT_PUBLIC_API_URL;
const ACCEPTED_TYPES = 'image/jpeg,image/png,image/webp';

export function MenuImageUpload({
  storeId,
  value,
  onChange,
  authHeaders,
}: {
  storeId: string;
  value: string;
  onChange: (url: string) => void;
  authHeaders: { Authorization: string } | undefined;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    setError(null);
    setIsUploading(true);
    try {
      const compressed = await imageCompression(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1280,
        useWebWorker: true,
      });
      const formData = new FormData();
      formData.append('file', compressed, file.name);

      const response = await axios.post(
        `${API_URL}/stores/${storeId}/menus/image`,
        formData,
        { headers: authHeaders },
      );
      const imageUrl = response.data?.data?.imageUrl ?? response.data?.imageUrl;
      if (!imageUrl) {
        throw new Error('No imageUrl in response');
      }
      onChange(imageUrl);
    } catch (err) {
      setError(getHttpErrorMessage(err, '이미지 업로드에 실패했습니다.'));
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleSelect}
        className="hidden"
      />
      {value ? (
        <div className="relative h-32 w-full overflow-hidden rounded-lg border border-gray-200">
          <img src={value} alt="메뉴 이미지" className="h-full w-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-2 top-2 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="flex h-32 w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-gray-300 text-sm text-gray-500 hover:border-gray-400 hover:bg-gray-50 disabled:opacity-60"
        >
          {isUploading ? (
            <>
              <Loader2 className="h-6 w-6 animate-spin" />
              업로드 중...
            </>
          ) : (
            <>
              <ImagePlus className="h-6 w-6" />
              이미지 업로드
            </>
          )}
        </button>
      )}
      {value && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={isUploading}
          className="text-xs font-semibold text-blue-600 hover:underline disabled:opacity-60"
        >
          {isUploading ? '업로드 중...' : '이미지 변경'}
        </button>
      )}
      {error && <p className="text-xs text-red-600">{error}</p>}
    </div>
  );
}
