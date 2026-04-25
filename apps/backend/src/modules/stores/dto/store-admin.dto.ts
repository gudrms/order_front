import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { StoreType } from '@prisma/client';
import {
    IsBoolean,
    IsEnum,
    IsInt,
    IsNotEmpty,
    IsObject,
    IsOptional,
    IsString,
    Min,
} from 'class-validator';

export class CreateStoreDto {
    @ApiProperty({ description: '공개 URL에 사용할 매장 타입 경로값', example: 'tacomolly' })
    @IsString()
    @IsNotEmpty()
    storeType: string;

    @ApiProperty({ description: '공개 URL에 사용할 지점 경로값', example: 'gimpo' })
    @IsString()
    @IsNotEmpty()
    branchId: string;

    @ApiProperty({ description: '고객에게 노출되는 매장명', example: '타코몰리 김포점' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: '지점 표시명', example: '김포점' })
    @IsString()
    @IsNotEmpty()
    branchName: string;

    @ApiPropertyOptional({ enum: StoreType, description: '매장 업종 구분' })
    @IsEnum(StoreType)
    @IsOptional()
    type?: StoreType;

    @ApiPropertyOptional({ description: '매장 소개 문구' })
    @IsString()
    @IsOptional()
    description?: string;

    @ApiPropertyOptional({ description: '매장 주소' })
    @IsString()
    @IsOptional()
    address?: string;

    @ApiPropertyOptional({ description: '매장 전화번호' })
    @IsString()
    @IsOptional()
    phoneNumber?: string;

    @ApiPropertyOptional({ description: 'Toss Place 지점 코드' })
    @IsString()
    @IsOptional()
    tossBranchCode?: string;

    @ApiPropertyOptional({ description: '사장님 가입용 초대코드. 생략하면 서버가 자동 생성합니다.' })
    @IsString()
    @IsOptional()
    inviteCode?: string;

    @ApiPropertyOptional({ description: '배달 주문 접수 가능 여부', default: false })
    @IsBoolean()
    @IsOptional()
    isDeliveryEnabled?: boolean;

    @ApiPropertyOptional({ description: '배달 최소 주문금액', default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    minimumOrderAmount?: number;

    @ApiPropertyOptional({ description: '기본 배달비', default: 0 })
    @IsInt()
    @Min(0)
    @IsOptional()
    deliveryFee?: number;

    @ApiPropertyOptional({ description: '무료 배달 기준 금액' })
    @IsInt()
    @Min(0)
    @IsOptional()
    freeDeliveryThreshold?: number;

    @ApiPropertyOptional({ description: '배달 가능 반경(m)' })
    @IsInt()
    @Min(0)
    @IsOptional()
    deliveryRadiusMeters?: number;

    @ApiPropertyOptional({ description: '예상 배달 시간(분)' })
    @IsInt()
    @Min(0)
    @IsOptional()
    estimatedDeliveryMinutes?: number;

    @ApiPropertyOptional({ description: '영업시간 설정 JSON' })
    @IsObject()
    @IsOptional()
    businessHours?: Record<string, unknown>;

    @ApiPropertyOptional({ description: '매장별 테마 설정 JSON' })
    @IsObject()
    @IsOptional()
    theme?: Record<string, unknown>;
}

export class UpdateStoreDto extends PartialType(CreateStoreDto) { }

export class CreateTablesDto {
    @ApiProperty({ description: '생성할 첫 테이블 번호', example: 1, minimum: 1 })
    @IsInt()
    @Min(1)
    startNumber: number;

    @ApiProperty({ description: '생성할 테이블 개수', example: 20, minimum: 1 })
    @IsInt()
    @Min(1)
    count: number;

    @ApiPropertyOptional({ description: '테이블 기본 수용 인원', example: 4, minimum: 1 })
    @IsInt()
    @Min(1)
    @IsOptional()
    capacity?: number;
}
