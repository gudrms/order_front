"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendOrderToOkpos = sendOrderToOkpos;
exports.sendOrderToOkposBackground = sendOrderToOkposBackground;
const OKPOS_API_URL = process.env.OKPOS_API_URL || '';
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;
async function sendOrderToOkpos(order, retries = MAX_RETRIES) {
    try {
        const response = await fetch(`${OKPOS_API_URL}/orders`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${process.env.OKPOS_API_KEY}`,
            },
            body: JSON.stringify(order),
            signal: AbortSignal.timeout(8000),
        });
        if (!response.ok) {
            throw new Error(`OKPOS API error: ${response.status}`);
        }
        const data = await response.json();
        return {
            success: true,
            okposOrderId: data.orderId,
        };
    }
    catch (error) {
        console.error(`[OKPOS] Send failed (${MAX_RETRIES - retries + 1}/${MAX_RETRIES}):`, error);
        if (retries > 0) {
            console.log(`[OKPOS] Retrying in ${RETRY_DELAY}ms...`);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            return sendOrderToOkpos(order, retries - 1);
        }
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        };
    }
}
function sendOrderToOkposBackground(order) {
    sendOrderToOkpos(order)
        .then((result) => {
        if (result.success) {
            console.log(`[OKPOS] Order ${order.orderNumber} sent successfully:`, result.okposOrderId);
        }
        else {
            console.error(`[OKPOS] Failed to send order ${order.orderNumber}:`, result.error);
        }
    })
        .catch((error) => {
        console.error(`[OKPOS] Unexpected error:`, error);
    });
}
//# sourceMappingURL=okpos-client.js.map