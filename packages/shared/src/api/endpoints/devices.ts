import { apiClient } from '../client';

export interface RegisterDeviceDto {
    fcmToken: string;
    deviceType?: string;
}

/**
 * FCM 디바이스 토큰 등록 (로그인 후 호출)
 */
export async function registerDevice(dto: RegisterDeviceDto): Promise<void> {
    await apiClient.post<{ success: boolean }>('/devices', dto);
}

/**
 * FCM 디바이스 토큰 삭제 (로그아웃 전 호출)
 */
export async function unregisterDevice(fcmToken: string): Promise<void> {
    await apiClient.delete<{ success: boolean }>(
        `/devices/${encodeURIComponent(fcmToken)}`
    );
}
