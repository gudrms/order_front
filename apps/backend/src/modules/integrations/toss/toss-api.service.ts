import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

export interface TossCategory {
    categoryCode: string;
    categoryName: string;
    displayOrder: number;
}

export interface TossProduct {
    productCode: string;
    categoryCode: string;
    productName: string;
    price: number;
    imageUrl?: string;
    soldOut: boolean;
    displayOrder: number;
    optionGroupCodes?: string[];
}

export interface TossOptionGroup {
    groupCode: string;
    groupName: string;
    minSelect: number;
    maxSelect: number;
    options: TossOption[];
}

export interface TossOption {
    optionCode: string;
    optionName: string;
    price: number;
    isSoldOut: boolean;
}

export interface TossMenuData {
    categories: TossCategory[];
    products: TossProduct[];
    optionGroups: TossOptionGroup[];
}

export interface TossPaymentConfirmRequest {
    paymentKey: string;
    orderId: string;
    amount: number;
    idempotencyKey: string;
}

@Injectable()
export class TossApiService {
    constructor(private readonly configService: ConfigService) { }

    async confirmPayment(request: TossPaymentConfirmRequest) {
        const secretKey = this.configService.get<string>('TOSS_PAYMENTS_SECRET_KEY')
            || this.configService.get<string>('TOSS_SECRET_KEY');

        if (!secretKey) {
            throw new InternalServerErrorException('Toss Payments secret key is not configured');
        }

        const authorization = Buffer.from(`${secretKey}:`).toString('base64');

        try {
            const response = await axios.post(
                'https://api.tosspayments.com/v1/payments/confirm',
                {
                    paymentKey: request.paymentKey,
                    orderId: request.orderId,
                    amount: request.amount,
                },
                {
                    headers: {
                        Authorization: `Basic ${authorization}`,
                        'Content-Type': 'application/json',
                        'Idempotency-Key': request.idempotencyKey,
                    },
                    timeout: 8000,
                },
            );

            return response.data;
        } catch (error) {
            if (axios.isAxiosError(error)) {
                const status = error.response?.status || 502;
                const message = (error.response?.data as any)?.message || error.message;
                throw new BadRequestException({
                    code: 'TOSS_CONFIRM_FAILED',
                    status,
                    message,
                    details: error.response?.data,
                });
            }

            throw error;
        }
    }

    async fetchMenuData(storeId: string): Promise<TossMenuData> {
        // 실제 Toss API 연동 대신 Mock Data 반환
        return {
            categories: [
                { categoryCode: 'CAT-001', categoryName: '메인 메뉴', displayOrder: 1 },
                { categoryCode: 'CAT-002', categoryName: '음료', displayOrder: 2 },
            ],
            products: [
                {
                    productCode: 'PRD-001',
                    categoryCode: 'CAT-001',
                    productName: '비프 타코',
                    price: 4500,
                    soldOut: false,
                    displayOrder: 1,
                    optionGroupCodes: ['GRP-001'],
                },
                {
                    productCode: 'PRD-002',
                    categoryCode: 'CAT-001',
                    productName: '쉬림프 타코',
                    price: 5000,
                    soldOut: false,
                    displayOrder: 2,
                    optionGroupCodes: ['GRP-001'],
                },
                {
                    productCode: 'PRD-003',
                    categoryCode: 'CAT-002',
                    productName: '콜라',
                    price: 2000,
                    soldOut: false,
                    displayOrder: 1,
                },
            ],
            optionGroups: [
                {
                    groupCode: 'GRP-001',
                    groupName: '맵기 선택',
                    minSelect: 1,
                    maxSelect: 1,
                    options: [
                        { optionCode: 'OPT-001', optionName: '순한맛', price: 0, isSoldOut: false },
                        { optionCode: 'OPT-002', optionName: '매운맛', price: 500, isSoldOut: false },
                    ],
                },
            ],
        };
    }
}
