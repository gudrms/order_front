/**
 * 범용 ID 생성 유틸 (서버/클라이언트 모두 안전)
 */

export function generateOrderId(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 10000).toString().padStart(4, '0');
    return `ORDER_${timestamp}_${random}`;
}
