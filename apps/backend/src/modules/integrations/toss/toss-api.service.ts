import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

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

@Injectable()
export class TossApiService {
    constructor(private readonly configService: ConfigService) { }

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
