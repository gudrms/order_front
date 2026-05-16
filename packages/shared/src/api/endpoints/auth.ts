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
    // Vercel cold start가 10-15초 걸릴 수 있어 기본 10초 타임아웃보다 넉넉하게 설정
    return apiClient.post<SyncedUser>('/auth/sync', data, { timeout: 25000 });
}
