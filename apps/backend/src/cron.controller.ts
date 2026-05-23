import { Controller, Headers, Post, UnauthorizedException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiHeader, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import * as Sentry from '@sentry/nestjs';
import { PrismaService } from './modules/prisma/prisma.service';
import { MenusService } from './modules/menus/menus.service';
import { QueueConsumerService } from './modules/queue/queue-consumer.service';
import { PaymentsService } from './modules/payments/payments.service';

@ApiTags('Cron')
@Controller('cron')
export class CronController {
    private readonly logger = new Logger(CronController.name);

    constructor(
        private readonly config: ConfigService,
        private readonly prisma: PrismaService,
        private readonly menusService: MenusService,
        private readonly queueConsumerService: QueueConsumerService,
        private readonly paymentsService: PaymentsService,
    ) {}

    @Post('batch')
    @ApiOperation({
        summary: '통합 크론 배치 API (웜업 + 큐 소비 + 결제 정합성)',
        description: '오전 10시 ~ 밤 12시(00시) 동안 5분 간격으로 호출되어 DB 웜업, 매장 메뉴 웜업, 백엔드 큐 소비, 미승인 결제 만료, 결제 정합성 보정을 원샷으로 실행합니다.',
    })
    @ApiHeader({
        name: 'x-internal-job-secret',
        description: '내부 배치 호출용 secret',
        required: true,
    })
    @ApiResponse({ status: 201, description: '배치 파이프라인 수행 완료' })
    @ApiResponse({ status: 401, description: '내부 배치 secret 불일치' })
    async runCronBatch(
        @Headers('x-internal-job-secret') secret: string | undefined,
    ) {
        this.assertInternalSecret(secret);
        const startTime = Date.now();
        this.logger.log('[CronBatch] Starting unified cron batch pipeline...');

        const results: {
            dbPing: boolean;
            warmUpStoresCount: number;
            queueConsumed: any;
            expiredPayments: any;
            reconciledPayments: any;
        } = {
            dbPing: false,
            warmUpStoresCount: 0,
            queueConsumed: null,
            expiredPayments: null,
            reconciledPayments: null,
        };

        try {
            // Step 1: Prisma DB Connection Check
            await this.prisma.$queryRaw`SELECT 1`;
            results.dbPing = true;
            this.logger.log('[CronBatch] Step 1: Database ping successful.');

            // Step 2: Store & Menu Query Warm-up
            // Vercel 서버리스 콜드 스타트를 완화하기 위해 실제 메뉴 읽기 로직을 타게 함.
            const activeStores = await this.prisma.store.findMany({
                where: { isActive: true },
                select: { id: true, name: true },
            });

            this.logger.log(`[CronBatch] Step 2: Found ${activeStores.length} active stores for warm-up.`);
            for (const store of activeStores) {
                try {
                    // getMenus()를 타서 Prisma 쿼리 엔진 및 DB 커넥션 풀을 실질적으로 웜업
                    const menus = await this.menusService.getMenus(store.id);
                    results.warmUpStoresCount++;
                    this.logger.log(`[CronBatch] Warm-up store success: ${store.name} (${store.id}), menus count: ${menus.length}`);
                } catch (e) {
                    this.logger.error(`[CronBatch] Warm-up failed for store ${store.id}: ${e.message}`);
                    Sentry.captureException(e, {
                        tags: { step: 'warm-up', storeId: store.id },
                    });
                }
            }

            // Step 3: Queue Processing (quantity: 3로 1회 소비)
            this.logger.log('[CronBatch] Step 3: Triggering backend queue processing...');
            try {
                results.queueConsumed = await this.queueConsumerService.processOnce({ quantity: 3 });
                this.logger.log(`[CronBatch] Queue process success. Consumed: ${JSON.stringify(results.queueConsumed)}`);
            } catch (e) {
                this.logger.error(`[CronBatch] Queue processing step failed: ${e.message}`);
                Sentry.captureException(e, { tags: { step: 'queue-process' } });
                results.queueConsumed = { error: e.message };
            }

            // Step 4: Expire Pending Toss Payments
            this.logger.log('[CronBatch] Step 4: Triggering Toss payments expiration...');
            try {
                results.expiredPayments = await this.paymentsService.expirePendingTossPayments({});
                this.logger.log(`[CronBatch] Payments expiration success: ${JSON.stringify(results.expiredPayments)}`);
            } catch (e) {
                this.logger.error(`[CronBatch] Toss payments expiration failed: ${e.message}`);
                Sentry.captureException(e, { tags: { step: 'payments-expire' } });
                results.expiredPayments = { error: e.message };
            }

            // Step 5: Reconcile Toss Payments
            this.logger.log('[CronBatch] Step 5: Triggering Toss payments reconciliation...');
            try {
                results.reconciledPayments = await this.paymentsService.reconcileTossPayments({});
                this.logger.log(`[CronBatch] Payments reconciliation success: ${JSON.stringify(results.reconciledPayments)}`);
            } catch (e) {
                this.logger.error(`[CronBatch] Toss payments reconciliation failed: ${e.message}`);
                Sentry.captureException(e, { tags: { step: 'payments-reconcile' } });
                results.reconciledPayments = { error: e.message };
            }

            const duration = Date.now() - startTime;
            this.logger.log(`[CronBatch] Unified cron batch completed successfully in ${duration}ms.`);
            return {
                statusCode: 201,
                success: true,
                durationMs: duration,
                results,
            };
        } catch (error) {
            const duration = Date.now() - startTime;
            this.logger.error(`[CronBatch] Fatal error in unified cron batch pipeline: ${error.message}`, error.stack);
            Sentry.captureException(error, {
                extra: { results, durationMs: duration },
            });
            throw error;
        }
    }

    private assertInternalSecret(secret: string | undefined) {
        const expected = this.config.get<string>('INTERNAL_JOB_SECRET');
        if (!expected || secret !== expected) {
            throw new UnauthorizedException('Invalid internal job secret');
        }
    }
}
