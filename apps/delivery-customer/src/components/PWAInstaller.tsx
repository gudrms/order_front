'use client';

import { useEffect, useState } from 'react';
import { X, Download } from 'lucide-react';

export default function PWAInstaller() {
    const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
    const [showInstallBanner, setShowInstallBanner] = useState(false);

    useEffect(() => {
        // Service Worker 등록
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker
                .register('/sw.js')
                .then((registration) => {
                    console.log('SW registered:', registration);
                })
                .catch((error) => {
                    console.log('SW registration failed:', error);
                });
        }

        // PWA 설치 프롬프트 이벤트 리스너
        const handleBeforeInstallPrompt = (e: Event) => {
            e.preventDefault();
            setDeferredPrompt(e);

            // 이미 설치되었는지 확인
            const isInstalled = localStorage.getItem('pwa-installed');
            const isDismissed = localStorage.getItem('pwa-banner-dismissed');

            if (!isInstalled && !isDismissed) {
                setShowInstallBanner(true);
            }
        };

        window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

        // 앱이 설치되었을 때
        window.addEventListener('appinstalled', () => {
            console.log('PWA was installed');
            localStorage.setItem('pwa-installed', 'true');
            setShowInstallBanner(false);
        });

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
        };
    }, []);

    const handleInstallClick = async () => {
        if (!deferredPrompt) return;

        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;

        console.log(`User response to the install prompt: ${outcome}`);

        setDeferredPrompt(null);
        setShowInstallBanner(false);
    };

    const handleDismiss = () => {
        setShowInstallBanner(false);
        localStorage.setItem('pwa-banner-dismissed', 'true');
    };

    if (!showInstallBanner) return null;

    return (
        <div className="fixed top-0 left-0 right-0 z-50 bg-gradient-to-r from-brand-yellow to-yellow-400 p-4 shadow-lg">
            <div className="max-w-[568px] mx-auto flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 flex-1">
                    <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center text-2xl shadow-sm">
                        🛵
                    </div>
                    <div className="flex-1">
                        <h3 className="font-bold text-brand-black">앱으로 설치하기</h3>
                        <p className="text-xs text-gray-700">빠르고 편리하게 주문하세요!</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleInstallClick}
                        className="bg-brand-black text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 whitespace-nowrap"
                    >
                        <Download size={16} />
                        설치
                    </button>
                    <button
                        onClick={handleDismiss}
                        className="p-2 text-gray-600 hover:text-gray-800"
                    >
                        <X size={20} />
                    </button>
                </div>
            </div>
        </div>
    );
}
