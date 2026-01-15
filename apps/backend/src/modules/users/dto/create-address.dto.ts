export class CreateAddressDto {
    name: string;
    address: string;
    detailAddress?: string;
    zipCode?: string;
    isDefault?: boolean;
}
