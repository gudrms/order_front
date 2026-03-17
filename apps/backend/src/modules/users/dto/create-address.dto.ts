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

    @IsBoolean()
    @IsOptional()
    isDefault?: boolean;
}
