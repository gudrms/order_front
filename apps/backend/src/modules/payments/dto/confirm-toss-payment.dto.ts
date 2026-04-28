import { IsInt, IsNotEmpty, IsOptional, IsString, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class ConfirmTossPaymentDto {
    @ApiProperty({
        description: 'Toss Payments success redirect에서 전달되는 결제 키',
        example: 'tgen_20260425123456AbCdE',
    })
    @IsString()
    @IsNotEmpty()
    paymentKey: string;

    @ApiProperty({
        description: 'Toss Payments에 요청한 주문 ID. Payment.providerOrderId와 매칭한다.',
        example: 'ORDER_1777093200000_1234',
    })
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({
        description: '승인할 결제 금액. 서버의 Payment.amount/Order.totalAmount와 반드시 일치해야 한다.',
        example: 24000,
        minimum: 0,
    })
    @IsInt()
    @Min(0)
    amount: number;
}

export class FailTossPaymentDto {
    @ApiProperty({
        description: 'Toss Payments에 요청한 주문 ID. Payment.providerOrderId와 매칭한다.',
        example: 'ORDER_1777093200000_1234',
    })
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @ApiPropertyOptional({
        description: 'Toss fail redirect 또는 클라이언트 abort에서 전달되는 실패 코드',
        example: 'PAY_PROCESS_CANCELED',
    })
    @IsString()
    @IsOptional()
    code?: string;

    @ApiPropertyOptional({
        description: '사용자에게 표시하거나 운영자가 확인할 실패 메시지',
        example: '사용자가 결제를 취소했습니다.',
    })
    @IsString()
    @IsOptional()
    message?: string;
}

export class ExpirePendingTossPaymentsDto {
    @ApiPropertyOptional({
        description: '만료 처리할 결제 대기 시간(분). 기본값은 15분입니다.',
        example: 15,
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    @IsOptional()
    olderThanMinutes?: number;
}

export class CancelTossPaymentDto {
    @ApiProperty({
        description: '취소/환불 사유',
        example: '고객 요청으로 주문을 취소합니다.',
    })
    @IsString()
    @IsNotEmpty()
    cancelReason: string;

    @ApiPropertyOptional({
        description: '부분 환불 금액. 생략하면 남은 결제 금액 전체를 취소합니다.',
        example: 5000,
        minimum: 1,
    })
    @IsInt()
    @Min(1)
    @IsOptional()
    cancelAmount?: number;
}
