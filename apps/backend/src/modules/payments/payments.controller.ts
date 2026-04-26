import { Body, Controller, Post, UsePipes, ValidationPipe } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { ConfirmTossPaymentDto, ExpirePendingTossPaymentsDto, FailTossPaymentDto } from './dto/confirm-toss-payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
    constructor(private readonly paymentsService: PaymentsService) { }

    @Post('toss/confirm')
    @UsePipes(new ValidationPipe({ transform: true }))
    @ApiOperation({
        summary: 'Toss Payments 결제 승인 검증',
        description: '배달앱/홈페이지 등 공통 주문 채널에서 Toss success redirect로 받은 paymentKey, orderId, amount를 서버에서 승인하고 주문 결제 상태를 PAID로 확정합니다.',
    })
    @ApiBody({ type: ConfirmTossPaymentDto })
    @ApiResponse({ status: 201, description: '결제 승인 성공' })
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
    async expirePendingTossPayments(@Body() dto: ExpirePendingTossPaymentsDto = {}) {
        return this.paymentsService.expirePendingTossPayments(dto);
    }
}
