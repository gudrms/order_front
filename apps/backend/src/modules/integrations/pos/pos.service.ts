import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PosService {
    private readonly logger = new Logger(PosService.name);

    async sendOrderToPos(order: any) {
        // 실제 POS API 연동 대신 로그 출력 (Mock)
        this.logger.log(`[POS Integration] Sending order to POS... OrderID: ${order.id}`);
        this.logger.log(`[POS Integration] Items: ${JSON.stringify(order.items, null, 2)}`);

        // 1초 지연 (네트워크 통신 흉내)
        await new Promise(resolve => setTimeout(resolve, 1000));

        this.logger.log(`[POS Integration] Order sent successfully!`);
        return { success: true, posOrderId: `POS-${order.orderNumber}` };
    }
}
