import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Min, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemOptionDto {
    @ApiProperty({
        description: '옵션 ID',
        example: 'opt-1',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    optionId: string;
}

export class CreateOrderItemDto {
    @ApiProperty({
        description: '메뉴 ID',
        example: 'menu-1',
        type: String,
    })
    @IsString()
    @IsNotEmpty()
    menuId: string;

    @ApiProperty({
        description: '주문 수량 (1 이상)',
        example: 2,
        minimum: 1,
        type: Number,
    })
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiProperty({
        description: '선택된 옵션 목록 (선택사항)',
        type: [CreateOrderItemOptionDto],
        required: false,
        example: [
            { optionId: 'opt-1' },
            { optionId: 'opt-2' },
        ],
    })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemOptionDto)
    options?: CreateOrderItemOptionDto[];
}

export class CreateOrderDto {
    @ApiProperty({
        description: '테이블 번호',
        example: 5,
        type: Number,
    })
    @IsInt()
    @IsNotEmpty()
    tableNumber: number;

    @ApiProperty({
        description: 'Toss Place 주문 ID (SDK로 생성된 경우)',
        example: 'TOSS-20240101-001',
        required: false,
        type: String,
    })
    @IsString()
    @IsOptional()
    tossOrderId?: string;

    @ApiProperty({
        description: '주문 항목 목록',
        type: [CreateOrderItemDto],
        example: [
            {
                menuId: 'menu-1',
                quantity: 2,
                options: [{ optionId: 'opt-1' }],
            },
            {
                menuId: 'menu-2',
                quantity: 1,
            },
        ],
    })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOrderItemDto)
    items: CreateOrderItemDto[];
}

export class DeliveryAddressDto {
    @ApiProperty({ description: '수령자 이름', example: '홍길동' })
    @IsString()
    @IsNotEmpty()
    recipientName: string;

    @ApiProperty({ description: '수령자 연락처', example: '010-1234-5678' })
    @IsString()
    @IsNotEmpty()
    recipientPhone: string;

    @ApiProperty({ description: '배달 주소', example: '서울시 강남구 테헤란로 123' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiProperty({ description: '상세 주소', example: '101동 1001호', required: false })
    @IsString()
    @IsOptional()
    detailAddress?: string;

    @ApiProperty({ description: '우편번호', example: '06234', required: false })
    @IsString()
    @IsOptional()
    zipCode?: string;

    @ApiProperty({ description: '배달 요청사항', example: '문 앞에 두고 벨 눌러주세요.', required: false })
    @IsString()
    @IsOptional()
    deliveryMemo?: string;

    @ApiProperty({ description: '사용자 주소록 ID', example: 'addr-1', required: false })
    @IsString()
    @IsOptional()
    addressId?: string;
}

export class DeliveryPaymentDto {
    @ApiProperty({ description: 'PG 주문 ID', example: 'ORDER_1777093200000_1234' })
    @IsString()
    @IsNotEmpty()
    orderId: string;

    @ApiProperty({ description: '결제 금액', example: 24000, minimum: 0 })
    @IsInt()
    @Min(0)
    amount: number;

    @ApiProperty({ description: '결제 키. 카드 결제 pending 생성 단계에서는 생략 가능', example: 'tgen_20260425123456AbCdE', required: false })
    @IsString()
    @IsOptional()
    paymentKey?: string;

    @ApiProperty({ description: 'Toss 결제 타입', example: 'NORMAL', required: false })
    @IsString()
    @IsOptional()
    paymentType?: 'NORMAL' | 'BRANDPAY' | 'KEY_IN';

    @ApiProperty({ description: '결제 수단', example: 'TOSS', required: false })
    @IsString()
    @IsOptional()
    method?: 'CARD' | 'TOSS' | 'KAKAO' | 'NAVER' | 'SAMSUNG' | 'PAYCO';
}

export class CreateDeliveryOrderItemOptionDto {
    @ApiProperty({ description: '선택 옵션 ID', example: 'opt-1', required: false })
    @IsString()
    @IsOptional()
    optionId?: string;

    @ApiProperty({ description: '옵션명 스냅샷', example: '매운맛', required: false })
    @IsString()
    @IsOptional()
    name?: string;

    @ApiProperty({ description: '옵션 가격 스냅샷', example: 500, required: false })
    @IsInt()
    @IsOptional()
    price?: number;
}

export class CreateDeliveryOrderItemDto {
    @ApiProperty({ description: '메뉴 ID', example: 'menu-1' })
    @IsString()
    @IsNotEmpty()
    menuId: string;

    @ApiProperty({ description: '메뉴명 스냅샷', example: '비프 타코', required: false })
    @IsString()
    @IsOptional()
    menuName?: string;

    @ApiProperty({ description: '주문 수량', example: 2, minimum: 1 })
    @IsInt()
    @Min(1)
    quantity: number;

    @ApiProperty({ description: '메뉴 가격 스냅샷', example: 4500, required: false })
    @IsInt()
    @IsOptional()
    price?: number;

    @ApiProperty({ description: '선택 옵션 목록', type: [CreateDeliveryOrderItemOptionDto], required: false })
    @IsArray()
    @IsOptional()
    @ValidateNested({ each: true })
    @Type(() => CreateDeliveryOrderItemOptionDto)
    options?: CreateDeliveryOrderItemOptionDto[];
}

export class CreateDeliveryOrderDto {
    @ApiProperty({ description: '매장 ID', example: 'store-1' })
    @IsString()
    @IsNotEmpty()
    storeId: string;

    @ApiProperty({ description: '사용자 ID', example: 'user-1', required: false })
    @IsString()
    @IsOptional()
    userId?: string;

    @ApiProperty({ description: '배달 정보', type: DeliveryAddressDto })
    @ValidateNested()
    @Type(() => DeliveryAddressDto)
    delivery: DeliveryAddressDto;

    @ApiProperty({ description: '주문 아이템 목록', type: [CreateDeliveryOrderItemDto] })
    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateDeliveryOrderItemDto)
    items: CreateDeliveryOrderItemDto[];

    @ApiProperty({ description: '총 주문 금액. 서버에서 메뉴/옵션/배달비 기준으로 재검증한다.', example: 24000 })
    @IsInt()
    @Min(0)
    totalAmount: number;

    @ApiProperty({ description: '결제 요청 정보', type: DeliveryPaymentDto })
    @ValidateNested()
    @Type(() => DeliveryPaymentDto)
    payment: DeliveryPaymentDto;

    @ApiProperty({ description: '적용할 UserCoupon ID (선택)', required: false })
    @IsOptional()
    @IsString()
    userCouponId?: string;
}
