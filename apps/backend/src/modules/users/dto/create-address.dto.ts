import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';

export class CreateAddressDto {
    @IsString()
    @IsNotEmpty()
    name: string;

    @IsString()
    @IsNotEmpty()
    address: string;

    @IsString()
    @IsOptional()
    detailAddress?: string;

    @IsString()
    @IsOptional()
    zipCode?: string;

    @IsString()
    @IsOptional()
    recipientName?: string;

    @IsString()
    @IsOptional()
    recipientPhone?: string;

    @IsString()
    @IsOptional()
    deliveryMemo?: string;

    @IsString()
    @IsOptional()
    entranceMemo?: string;

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}
