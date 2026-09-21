/**
 * 웹에서 쓸 토스트 저장소.
 *
 * `lib/capacitor/toast.ts`는 네이티브에서 Capacitor Toast를 띄우지만 웹에서는 아무것도
 * 하지 않았다. 그래서 훅이나 쿼리 콜백처럼 붙일 UI가 없는 곳의 안내가 웹에서 통째로
 * 사라졌다. React 밖에서도 호출할 수 있어야 하므로 모듈 스코프 pub/sub으로 둔다.
 *
 * 네이티브 Toast와 동작을 맞춰 한 번에 하나만 보여준다. 새 토스트가 오면 이전 것을 덮는다.
 */

export type WebToast = {
    /** 같은 문구가 연달아 와도 다시 띄우려면 id가 바뀌어야 한다. */
    id: number;
    message: string;
    durationMs: number;
};

let current: WebToast | null = null;
let nextId = 1;
const listeners = new Set<() => void>();

function emit() {
    listeners.forEach((listener) => listener());
}

export function subscribeWebToast(listener: () => void) {
    listeners.add(listener);
    return () => {
        listeners.delete(listener);
    };
}

export function getWebToast() {
    return current;
}

/** 서버 렌더링 시점에는 항상 토스트가 없다. */
export function getWebToastServerSnapshot(): WebToast | null {
    return null;
}

export function showWebToast(message: string, durationMs: number) {
    current = { id: nextId++, message, durationMs };
    emit();
}

export function dismissWebToast(id: number) {
    // 표시가 끝난 토스트만 지운다. 늦게 도착한 타이머가 새 토스트를 지우면 안 된다.
    if (current?.id !== id) return;
    current = null;
    emit();
}
