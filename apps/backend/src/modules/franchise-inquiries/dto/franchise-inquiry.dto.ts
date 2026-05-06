import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FranchiseInquiryStatus } from '@prisma/client';
import { IsEmail, IsEnum, IsOptional, IsString, Length, MaxLength } from 'class-validator';

export class CreateFranchiseInquiryDto {
  @ApiProperty({ example: 'Kim Minjun' })
  @IsString()
  @Length(2, 50)
  name!: string;

  @ApiProperty({ example: '01012345678' })
  @IsString()
  @Length(10, 20)
  phone!: string;

  @ApiProperty({ example: 'owner@example.com' })
  @IsEmail()
  @MaxLength(120)
  email!: string;

  @ApiProperty({ example: 'Seoul Gangnam' })
  @IsString()
  @Length(2, 100)
  area!: string;

  @ApiPropertyOptional({ example: 'I want to open a store near Gangnam station.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  message?: string;
}

export class UpdateFranchiseInquiryDto {
  @ApiPropertyOptional({ enum: FranchiseInquiryStatus })
  @IsEnum(FranchiseInquiryStatus)
  @IsOptional()
  status?: FranchiseInquiryStatus;

  @ApiPropertyOptional({ example: 'Called once, requested brochure.' })
  @IsString()
  @IsOptional()
  @MaxLength(1000)
  adminNote?: string;
}
