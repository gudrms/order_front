import {
    PushNotifications,
    type Token,
    type PushNotificationSchema,
    type ActionPerformed,
} from '@capacitor/push-notifications';
import { LocalNotifications } from '@capacitor/local-notifications';
import { isNative, isIOS } from './index';

// ---------------------------------------------------------------------------
// 모듈 상태
// ---------------------------------------------------------------------------

/** 현재 기기에 발급된 FCM/APNS 토큰 */
let _currentToken: string | null = null;

/** 외부에서 현재 토큰 조회 (AuthContext 로그아웃 시 사용) */
export function getCurrentPushToken(): string | null {
    return _currentToken;
}

/** 현재 기기 플랫폼 타입 문자열 */
export function getPushDeviceType(): string {
    return isIOS ? 'ios' : 'android';
}

// ---------------------------------------------------------------------------
// 네비게이션 이벤트 (푸시 탭 → 페이지 이동)
// ---------------------------------------------------------------------------

const PUSH_NAVIGATE_EVENT = 'push:navigate';

/**
 * 푸시 알림 탭 시 발생하는 네비게이션 이벤트 리스너 등록.
 * url 은 "/orders/abc123" 같은 내부 경로.
 */
export function addPushNavigateListener(
    handler: (path: string) => void
): () => void {
    const listener = (e: Event) =>
        handler((e as CustomEvent<string>).detail);
    window.addEventListener(PUSH_NAVIGATE_EVENT, listener);
    return () => window.removeEventListener(PUSH_NAVIGATE_EVENT, listener);
}

function dispatchPushNavigate(path: string) {
    window.dispatchEvent(
        new CustomEvent<string>(PUSH_NAVIGATE_EVENT, { detail: path })
    );
}

// ---------------------------------------------------------------------------
// 알림 데이터 → 경로 변환
// ---------------------------------------------------------------------------

/**
 * FCM data payload 에서 내부 경로 추출.
 * 백엔드가 data.orderId / data.url 을 담아 보냄.
 */
function extractPathFromData(data: Record<string, string> | undefined): string | null {
    if (!data) return null;
    if (data.url) return data.url;
    if (data.orderId) return `/orders/${data.orderId}`;
    return null;
}

// ---------------------------------------------------------------------------
// 초기화 / 해제
// ---------------------------------------------------------------------------

/**
 * 푸시 알림 초기화.
 *
 * - 권한 요청 후 등록
 * - 토큰 수신 → onToken 콜백 (React 훅에서 백엔드 등록 처리)
 * - 포어그라운드 알림 수신 → LocalNotifications 로 즉시 표시
 * - 알림 탭 → dispatchPushNavigate 로 라우터에 전달
 *
 * @param onToken 토큰을 받으면 호출되는 콜백 (token, deviceType)
 */
export async function initPushNotifications(
    onToken: (token: string, deviceType: string) => void
): Promise<void> {
    if (!isNative) return;

    try {
        const permission = await PushNotifications.requestPermissions();
        if (permission.receive !== 'granted') {
            console.warn('[Push] 권한 거부됨');
            return;
        }

        await PushNotifications.register();

        // 토큰 수신
        await PushNotifications.addListener('registration', (token: Token) => {
            _currentToken = token.value;
            onToken(token.value, getPushDeviceType());
        });

        // 등록 오류
        await PushNotifications.addListener('registrationError', (err) => {
            console.error('[Push] 등록 실패:', err.error);
        });

        // 포어그라운드 알림 수신 → 로컬 알림으로 즉시 표시
        await PushNotifications.addListener(
            'pushNotificationReceived',
            async (notification: PushNotificationSchema) => {
                try {
                    await LocalNotifications.schedule({
                        notifications: [
                            {
                                id: Date.now(),
                                title: notification.title ?? '타코 배달',
                                body: notification.body ?? '',
                                schedule: { at: new Date(Date.now() + 300) },
                                extra: notification.data ?? {},
                            },
                        ],
                    });
                } catch (e) {
                    console.warn('[Push] 로컬 알림 표시 실패:', e);
                }
            }
        );

        // 알림 탭 → 페이지 이동
        await PushNotifications.addListener(
            'pushNotificationActionPerformed',
            (action: ActionPerformed) => {
                const data = action.notification.data as
                    | Record<string, string>
                    | undefined;
                const path = extractPathFromData(data);
                if (path) {
                    dispatchPushNavigate(path);
                }
            }
        );
    } catch (error) {
        console.error('[Push] 초기화 실패:', error);
    }
}

/**
 * 푸시 알림 구독 해제 (로그아웃 시).
 * 리스너만 제거; 토큰 DB 삭제는 AuthContext 에서 처리.
 */
export async function cleanupPushNotifications(): Promise<void> {
    if (!isNative) return;
    try {
        await PushNotifications.removeAllListeners();
        _currentToken = null;
    } catch (error) {
        console.error('[Push] 구독 해제 실패:', error);
    }
}
