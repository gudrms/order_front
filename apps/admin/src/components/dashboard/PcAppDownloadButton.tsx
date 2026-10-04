'use client';

import { useEffect, useState } from 'react';
import { Download } from 'lucide-react';
import { isAdminElectronRuntime } from '@/lib/electronBridge';

// Windows 설치 파일(.exe) 주소. 비워 두면 버튼을 숨긴다
const PC_APP_DOWNLOAD_URL = process.env.NEXT_PUBLIC_ADMIN_PC_APP_URL;

/**
 * 브라우저로 관리자 화면을 연 매장에 PC 앱(admin-electron) 설치를 안내한다.
 * PC 앱은 무음 인쇄·알림음 자동 재생이 되므로 매장 PC는 앱 사용을 권장한다.
 * PC 앱 안에서 열었을 때는 숨긴다.
 */
export function PcAppDownloadButton() {
  // electron 여부는 브라우저에서만 알 수 있어 마운트 후 판단한다 (SSR 불일치 방지)
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(!!PC_APP_DOWNLOAD_URL && !isAdminElectronRuntime());
  }, []);

  if (!visible) return null;

  return (
    <a
      href={PC_APP_DOWNLOAD_URL}
      className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50"
      title="무음 인쇄와 알림음이 되는 매장용 PC 앱을 설치합니다."
      data-testid="admin-pc-app-download"
    >
      <Download className="h-4 w-4" />
      PC 앱 다운로드
    </a>
  );
}
