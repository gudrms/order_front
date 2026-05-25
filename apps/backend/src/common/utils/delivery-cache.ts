type DeliveryCachePayload = {
    storeId?: string;
    menuId?: string;
    tags?: string[];
};

type WarnLogger = {
    warn(message: string): void;
};

const REVALIDATE_TIMEOUT_MS = 3000;

export async function revalidateDeliveryCache(
    payload: DeliveryCachePayload,
    logger?: WarnLogger,
) {
    const url = process.env.DELIVERY_REVALIDATE_URL;
    const secret = process.env.DELIVERY_REVALIDATE_SECRET;

    if (!url || !secret) {
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
