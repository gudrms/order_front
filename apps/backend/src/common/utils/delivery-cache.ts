type DeliveryCachePayload = {
    storeId?: string;
    menuId?: string;
    tags?: string[];
};

type WarnLogger = {
    warn(message: string): void;
};

const REVALIDATE_TIMEOUT_MS = 3000;

let missingEnvWarned = false;

export async function revalidateDeliveryCache(
    payload: DeliveryCachePayload,
    logger?: WarnLogger,
) {
    const url = process.env.DELIVERY_REVALIDATE_URL;
    const secret = process.env.DELIVERY_REVALIDATE_SECRET;

    if (!url || !secret) {
        // 설정 누락 시 조용히 넘어가면 "관리자 변경이 배달앱에 안 뜬다"는
        // 원인 파악이 어려우므로 최초 1회 경고한다.
        if (!missingEnvWarned) {
            missingEnvWarned = true;
            logger?.warn(
                'DELIVERY_REVALIDATE_URL 또는 DELIVERY_REVALIDATE_SECRET 미설정 - 배달앱 캐시 즉시 무효화 비활성화 (TTL 만료까지 반영 지연)',
            );
        }
        return;
    }

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REVALIDATE_TIMEOUT_MS);
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'x-revalidate-secret': secret,
            },
            body: JSON.stringify(payload),
            signal: controller.signal,
        }).finally(() => clearTimeout(timeoutId));

        if (!response.ok) {
            logger?.warn(`Delivery cache revalidate failed (${response.status})`);
        }
    } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        logger?.warn(`Delivery cache revalidate request failed: ${message}`);
    }
}
