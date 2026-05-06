import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsOptional, IsString, Length, Matches, MaxLength } from 'class-validator';

export class CreateFranchiseInquiryDto {
    @ApiProperty({ description: '신청자 이름', example: '홍길동' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @Length(1, 50)
    name: string;

    @ApiProperty({ description: '연락처 (숫자 11자리)', example: '01012345678' })
    @Transform(({ value }) => typeof value === 'string' ? value.replace(/[^0-9]/g, '') : value)
    @IsString()
    @Matches(/^[0-9]{10,11}$/, { message: '연락처는 10~11자리 숫자만 허용됩니다.' })
    phone: string;

    @ApiProperty({ description: '이메일', example: 'hong@example.com' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim().toLowerCase() : value)
    @IsEmail({}, { message: '올바른 이메일 형식을 입력해주세요.' })
    @MaxLength(120)
    email: string;

    @ApiProperty({ description: '희망 창업 지역', example: '서울시 강남구' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsString()
    @Length(1, 100)
    area: string;

    @ApiPropertyOptional({ description: '추가 문의 내용' })
    @Transform(({ value }) => typeof value === 'string' ? value.trim() : value)
    @IsOptional()
    @IsString()
    @MaxLength(1000)
    message?: string;
}
