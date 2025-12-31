import { Injectable, Logger } from '@nestjs/common';
import { PosProvider } from './pos.interface';

@Injectable()
export class MockPosService implements PosProvider {
    private readonly logger = new Logger(MockPosService.name);

    async sendOrder(order: any): Promise<boolean> {
        // 실제 POS API 연동 대신 로그 출력 (Mock)
        this.logger.log(`[POS Integration] Sending order to POS... OrderID: ${order.orderNumber}`);

        // 1초 지연 (네트워크 통신 흉내)
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 랜덤 실패 시뮬레이션 (테스트용)
        // if (Math.random() < 0.3) {
        //     throw new Error('Random POS Connection Error');
        // }

        this.logger.log(`[POS Integration] Order sent successfully!`);
        return true;
    }

    async checkHealth(): Promise<boolean> {
        return true;
    }
}
