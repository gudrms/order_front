import { IsEmail, IsIn, IsOptional, IsString, MinLength, ValidateIf } from 'class-validator';

export class CreateAdminAccountDto {
    @IsEmail()
    email!: string;

    @IsString()
    @MinLength(8)
    password!: string;

    @IsOptional()
    @IsString()
    name?: string;

    @IsOptional()
    @IsString()
    phoneNumber?: string;

    @IsIn(['ADMIN', 'OWNER'])
    role!: 'ADMIN' | 'OWNER';

    @ValidateIf((dto: CreateAdminAccountDto) => dto.role === 'OWNER')
    @IsString()
    storeId?: string;
}

export class ResetAdminAccountPasswordDto {
    @IsString()
    @MinLength(8)
    password!: string;
}
