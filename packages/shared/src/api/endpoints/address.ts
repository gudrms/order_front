import type { CreateUserAddressRequest, UpdateUserAddressRequest, UserAddress } from '../../types';
import { apiClient } from '../client';

export async function getAddresses(): Promise<UserAddress[]> {
    return apiClient.get<UserAddress[]>('/users/me/addresses');
}

export async function createAddress(request: CreateUserAddressRequest): Promise<UserAddress> {
    return apiClient.post<UserAddress>('/users/me/addresses', request);
}

export async function updateAddress(
    addressId: string,
    request: UpdateUserAddressRequest
): Promise<UserAddress> {
    return apiClient.patch<UserAddress>(`/users/me/addresses/${addressId}`, request);
}

export async function setDefaultAddress(addressId: string): Promise<UserAddress> {
    return apiClient.patch<UserAddress>(`/users/me/addresses/${addressId}/default`);
}

export async function deleteAddress(addressId: string): Promise<UserAddress> {
    return apiClient.delete<UserAddress>(`/users/me/addresses/${addressId}`);
}
