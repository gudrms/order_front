import { ApiProperty, ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class CreateAddressDto {
    @ApiProperty({ description: '주소 별칭', example: '집' })
    @IsString()
    @IsNotEmpty()
    name: string;

    @ApiProperty({ description: '기본 주소', example: '서울 강남구 테헤란로 123' })
    @IsString()
    @IsNotEmpty()
    address: string;

    @ApiPropertyOptional({ description: '상세 주소', example: '101동 1001호' })
    @IsString()
    @IsOptional()
    detailAddress?: string;

    @ApiPropertyOptional({ description: '우편번호', example: '06234' })
    @IsString()
    @IsOptional()
    zipCode?: string;

    @ApiPropertyOptional({ description: '수령인 이름', example: '홍길동' })
    @IsString()
    @IsOptional()
    recipientName?: string;

    @ApiPropertyOptional({ description: '수령인 연락처', example: '010-1234-5678' })
    @IsString()
    @IsOptional()
    recipientPhone?: string;

    @ApiPropertyOptional({ description: '배달 요청사항', example: '문 앞에 놓아주세요' })
    @IsString()
    @IsOptional()
    deliveryMemo?: string;

    @ApiPropertyOptional({ description: '공동현관/출입 메모', example: '공동현관 1234#' })
    @IsString()
    @IsOptional()
    entranceMemo?: string;

    @ApiPropertyOptional({ description: '위도', example: 37.5665 })
    @IsNumber()
    @IsOptional()
    latitude?: number;

    @ApiPropertyOptional({ description: '경도', example: 126.9780 })
    @IsNumber()
    @IsOptional()
    longitude?: number;

    @ApiPropertyOptional({ description: '기본 배달지 여부', example: true })
    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}

export class UpdateAddressDto extends PartialType(CreateAddressDto) { }
