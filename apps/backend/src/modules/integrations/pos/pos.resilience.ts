import { Injectable, Logger, Inject } from '@nestjs/common';
import { PosProvider } from './pos.interface';
import CircuitBreaker from 'opossum';

@Injectable()
export class ResilientPosService implements PosProvider {
    private breaker: CircuitBreaker;
    private readonly logger = new Logger(ResilientPosService.name);

    constructor(
        @Inject('POS_PROVIDER') private readonly provider: PosProvider,
    ) {
        // Circuit Breaker 설정
        const options = {
            timeout: 3000, // 3초 타임아웃
            errorThresholdPercentage: 50, // 50% 이상 실패 시 오픈
            resetTimeout: 10000, // 10초 후 다시 시도 (Half-Open)
        };

        this.breaker = new CircuitBreaker(
            (order: any) => this.provider.sendOrder(order),
            options,
        );

        this.breaker.fallback(() => {
            this.logger.warn('Circuit is OPEN or request failed. Fallback executed.');
            return false; // 실패 처리
        });

        this.breaker.on('open', () => this.logger.warn('🔴 Circuit Breaker OPENED'));
        this.breaker.on('close', () => this.logger.log('🟢 Circuit Breaker CLOSED'));
        this.breaker.on('halfOpen', () => this.logger.log('🟡 Circuit Breaker HALF-OPEN'));
    }

    async sendOrder(order: any): Promise<boolean> {
        try {
            // Circuit Breaker를 통해 실행
            const result = await this.breaker.fire(order);
            return result as boolean;
        } catch (error) {
            this.logger.error(`Failed to send order via Circuit Breaker: ${error.message}`);
            return false;
        }
    }

    async checkHealth(): Promise<boolean> {
        return this.provider.checkHealth();
    }
}
