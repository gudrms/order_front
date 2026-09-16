/**
 * 로그인/OAuth 콜백 후 이동할 redirect 값을 검증한다.
 * `/`로 시작하지 않거나 `//`(프로토콜 상대 URL)로 시작하면 외부 사이트로
 * 열린 리다이렉트(open redirect)가 될 수 있어 안전한 내부 경로만 허용한다.
 */
export function sanitizeRedirect(path: string | null | undefined): string {
    if (path && path.startsWith('/') && !path.startsWith('//')) {
        return path;
    }
    return '/';
}
