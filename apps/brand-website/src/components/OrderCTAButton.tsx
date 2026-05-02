'use client';

import { useCallback } from 'react';
import type { ReactNode } from 'react';

interface OrderCTAButtonProps {
    className?: string;
    children: ReactNode;
    onClick?: () => void;
}

const DEEP_LINK_TIMEOUT_MS = 1500;

function isMobileUA(): boolean {
    if (typeof navigator === 'undefined') return false;
    return /android|iphone|ipad|ipod/i.test(navigator.userAgent);
}

/**
 * 주문하기 CTA. 모바일이면 `taco://` 스킴으로 네이티브 앱 실행을 시도하고,
 * 일정 시간 내 응답이 없으면 배달앱 웹 URL로 fallback 한다.
 */
export default function OrderCTAButton({ className, children, onClick }: OrderCTAButtonProps) {
    const deliveryUrl = process.env.NEXT_PUBLIC_DELIVERY_URL || 'http://localhost:3001';

    const handleClick = useCallback(() => {
        onClick?.();

        if (!isMobileUA()) {
            window.open(deliveryUrl, '_blank', 'noopener,noreferrer');
            return;
        }

        let fellBack = false;
        const fallback = () => {
            if (fellBack) return;
            fellBack = true;
            window.location.href = deliveryUrl;
        };

        const timer = window.setTimeout(fallback, DEEP_LINK_TIMEOUT_MS);
        const onVisibility = () => {
            if (document.visibilityState === 'hidden') {
                window.clearTimeout(timer);
                document.removeEventListener('visibilitychange', onVisibility);
            }
        };
        document.addEventListener('visibilitychange', onVisibility);

        window.location.href = 'taco://';
    }, [deliveryUrl, onClick]);

    return (
        <button type="button" onClick={handleClick} className={className}>
            {children}
        </button>
    );
}
