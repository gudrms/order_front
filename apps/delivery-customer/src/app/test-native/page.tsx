'use client';

import { useState } from 'react';
import { platform } from '@/lib/capacitor';
import { takePicture, pickImage } from '@/lib/capacitor/camera';
import {
  getCurrentPosition,
  requestPermissions,
} from '@/lib/capacitor/geolocation';

export default function TestNativePage() {
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [location, setLocation] = useState<any>(null);

  const handleTakePicture = async () => {
    const url = await takePicture();
    if (url) setImageUrl(url);
  };

  const handlePickImage = async () => {
    const url = await pickImage();
    if (url) setImageUrl(url);
  };

  const handleGetLocation = async () => {
    await requestPermissions();
    const pos = await getCurrentPosition();
    if (pos) setLocation(pos);
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-3xl font-bold mb-8">Native 기능 테스트</h1>

      {/* 플랫폼 정보 */}
      <div className="mb-8 p-4 bg-gray-100 rounded">
        <h2 className="text-xl font-bold mb-2">플랫폼 정보</h2>
        <p>플랫폼: {platform.name}</p>
        <p>네이티브: {platform.isNative ? '예' : '아니오'}</p>
        <p>웹: {platform.isWeb ? '예' : '아니오'}</p>
        <p>iOS: {platform.isIOS ? '예' : '아니오'}</p>
        <p>Android: {platform.isAndroid ? '예' : '아니오'}</p>
      </div>

      {/* 카메라 테스트 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">카메라</h2>
        <div className="space-x-4">
          <button
            onClick={handleTakePicture}
            className="px-4 py-2 bg-blue-500 text-white rounded"
            disabled={!platform.isNative}
          >
            사진 촬영
          </button>
          <button
            onClick={handlePickImage}
            className="px-4 py-2 bg-green-500 text-white rounded"
            disabled={!platform.isNative}
          >
            갤러리에서 선택
          </button>
        </div>
        {imageUrl && (
          <img
            src={imageUrl}
            alt="선택한 이미지"
            className="mt-4 max-w-md rounded"
          />
        )}
      </div>

      {/* 위치 정보 테스트 */}
      <div className="mb-8">
        <h2 className="text-xl font-bold mb-4">위치 정보</h2>
        <button
          onClick={handleGetLocation}
          className="px-4 py-2 bg-purple-500 text-white rounded"
          disabled={!platform.isNative}
        >
          현재 위치 가져오기
        </button>
        {location && (
          <div className="mt-4 p-4 bg-gray-100 rounded">
            <p>위도: {location.latitude}</p>
            <p>경도: {location.longitude}</p>
            <p>정확도: {location.accuracy}m</p>
          </div>
        )}
      </div>

      {/* 안내 메시지 */}
      {!platform.isNative && (
        <div className="p-4 bg-yellow-100 border border-yellow-400 rounded">
          <p className="font-bold">⚠️ 웹 브라우저에서는 네이티브 기능을 사용할 수 없습니다.</p>
          <p className="mt-2">
            앱에서 테스트하려면:
          </p>
          <ol className="list-decimal list-inside mt-2">
            <li>npm run cap:sync</li>
            <li>npm run cap:open:android (또는 ios)</li>
            <li>Android Studio/Xcode에서 앱 실행</li>
          </ol>
        </div>
      )}
    </div>
  );
}
