import { Body, Controller, Headers, Param, Post, UnauthorizedException, UseGuards, UsePipes, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ApiBearerAuth, ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfirmTossPaymentDto, ExpirePendingTossPaymentsDto, FailTossPaymentDto, CancelTossPaymentDto, ReconcileTossPaymentsDto } from './dto/confirm-toss-payment.dto';
import { PaymentsService } from './payments.service';
import { SupabaseGuard } from '../auth/guards/supabase.guard';
import { CurrentUser } from '../../common/decorators/user.decorator';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(
        private readonly paymentsService: PaymentsService,
        private readonly config: ConfigService,
    ) { }

    @Post('toss/confirm')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: 'Toss Payments 결제 승인 검증',
        description: '배달앱/홈페이지 등 공통 주문 채널에서 Toss success redirect로 받은 paymentKey, orderId, amount를 서버에서 승인하고 주문 결제 상태를 PAID로 확정합니다.',
    })
    @ApiBody({ type: ConfirmTossPaymentDto })
    @ApiResponse({
        status: 201,
        description: '결제 승인 성공',
        schema: {
            example: {
                statusCode: 201,
                data: {
                    orderId: 'cm9ord456ghi789jkl',
                    orderNumber: 'ORD-20240101-001',
                    paymentKey: 'tgen_20260425123456AbCdE',
                    status: 'PAID',
                    approvedAmount: 24000,
                    approvedAt: '2024-01-01T12:00:00.000Z',
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: '금액 불일치 또는 Toss 승인 실패' })
    @ApiResponse({ status: 404, description: '대기 중인 결제 정보를 찾을 수 없음' })
    async confirmTossPayment(@Body() dto: ConfirmTossPaymentDto) {
        return this.paymentsService.confirmTossPayment(dto);
    }

    @Post('toss/fail')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: 'Toss Payments 결제 실패 기록',
        description: 'Toss fail redirect 또는 결제창 abort 시 공통 Payment를 FAILED로, 주문을 CANCELLED로 기록합니다. 배달 주문이면 OrderDelivery도 함께 취소합니다.',
    })
    @ApiBody({ type: FailTossPaymentDto })
    @ApiResponse({ status: 201, description: '결제 실패 기록 성공' })
    @ApiResponse({ status: 404, description: '대기 중인 결제 정보를 찾을 수 없음' })
    async failTossPayment(@Body() dto: FailTossPaymentDto) {
        return this.paymentsService.failTossPayment(dto);
    }

    @Post('toss/expire-pending')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: 'Toss Payments 대기 주문 만료 처리',
        description: 'PENDING_PAYMENT 상태로 남은 배달 주문 중 지정 시간 이상 승인되지 않은 결제를 FAILED/CANCELLED로 정리합니다. cron 또는 운영 배치에서 호출할 수 있습니다.',
    })
    @ApiBody({ type: ExpirePendingTossPaymentsDto, required: false })
    @ApiResponse({ status: 201, description: '만료 주문 정리 완료' })
    async expirePendingTossPayments(
        @Headers('x-internal-job-secret') secret: string | undefined,
        @Body() dto: ExpirePendingTossPaymentsDto = {},
    ) {
        this.assertInternalSecret(secret);
        return this.paymentsService.expirePendingTossPayments(dto);
    }

    @Post('toss/reconcile')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: 'Toss Payments 상태 불일치 복구 큐 등록',
        description: 'Toss 승인 이후 로컬 DB 확정이 실패했을 수 있는 결제를 찾아 payment.reconcile 큐 작업으로 등록합니다.',
    })
    @ApiBody({ type: ReconcileTossPaymentsDto, required: false })
    @ApiResponse({ status: 201, description: '복구 큐 등록 완료' })
    async reconcileTossPayments(
        @Headers('x-internal-job-secret') secret: string | undefined,
        @Body() dto: ReconcileTossPaymentsDto = {},
    ) {
        this.assertInternalSecret(secret);
        return this.paymentsService.reconcileTossPayments(dto);
    }

    @Post('orders/:orderId/toss/cancel')
    @UseGuards(SupabaseGuard)
    @ApiBearerAuth('JWT-auth')
    @UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
    @ApiOperation({
        summary: '관리자 Toss 결제 취소/환불',
        description: '관리자 또는 매장 소유자가 결제 완료 주문의 Toss Payments 결제를 전액 또는 부분 취소합니다.',
    })
    @ApiParam({ name: 'orderId', description: '주문 ID' })
    @ApiBody({ type: CancelTossPaymentDto })
    @ApiResponse({
        status: 201,
        description: '결제 취소/환불 성공',
        schema: {
            example: {
                statusCode: 201,
                data: {
                    orderId: 'cm9ord456ghi789jkl',
                    canceledAmount: 24000,
                    remainAmount: 0,
                    status: 'CANCELLED',
                },
            },
        },
    })
    @ApiResponse({ status: 400, description: '환불할 수 없는 결제 상태 또는 금액' })
    @ApiResponse({ status: 401, description: '인증 실패' })
    @ApiResponse({ status: 404, description: '주문 또는 결제 정보를 찾을 수 없음' })
    async cancelOrderTossPayment(
        @CurrentUser() user: { id: string },
        @Param('orderId') orderId: string,
        @Body() dto: CancelTossPaymentDto,
    ) {
        return this.paymentsService.cancelOrderTossPayment(user.id, orderId, dto);
    }

    private assertInternalSecret(secret: string | undefined) {
        const expected = this.config.get<string>('INTERNAL_JOB_SECRET');
        if (!expected || secret !== expected) {
            throw new UnauthorizedException('Invalid internal job secret');
        }
    }
}
