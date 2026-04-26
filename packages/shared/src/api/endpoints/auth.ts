import { apiClient } from '../client';

export interface SyncCurrentUserRequest {
    name?: string | null;
    phoneNumber?: string | null;
}

export interface SyncedUser {
    id: string;
    email: string;
    name?: string | null;
    phoneNumber?: string | null;
    role?: string;
}

export async function syncCurrentUser(data: SyncCurrentUserRequest = {}): Promise<SyncedUser> {
    return apiClient.post<SyncedUser>('/auth/sync', data);
}
