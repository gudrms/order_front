import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@order/shared';
import type { CreateUserAddressRequest, UpdateUserAddressRequest } from '@order/shared';

export const addressQueryKey = ['addresses'];

export function useAddresses(userId?: string | null) {
    return useQuery({
        queryKey: [...addressQueryKey, userId],
        queryFn: () => api.address.getAddresses(),
        enabled: !!userId,
    });
}

export function useCreateAddress(userId?: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (request: CreateUserAddressRequest) => api.address.createAddress(request),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: addressQueryKey });
            if (userId) {
                queryClient.invalidateQueries({ queryKey: [...addressQueryKey, userId] });
            }
        },
    });
}

export function useUpdateAddress(userId?: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ id, data }: { id: string; data: UpdateUserAddressRequest }) => (
            api.address.updateAddress(id, data)
        ),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: addressQueryKey });
            if (userId) {
                queryClient.invalidateQueries({ queryKey: [...addressQueryKey, userId] });
            }
        },
    });
}

export function useSetDefaultAddress(userId?: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.address.setDefaultAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: addressQueryKey });
            if (userId) {
                queryClient.invalidateQueries({ queryKey: [...addressQueryKey, userId] });
            }
        },
    });
}

export function useDeleteAddress(userId?: string | null) {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (id: string) => api.address.deleteAddress(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: addressQueryKey });
            if (userId) {
                queryClient.invalidateQueries({ queryKey: [...addressQueryKey, userId] });
            }
        },
    });
}
