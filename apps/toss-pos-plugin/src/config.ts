import { createClient } from '@supabase/supabase-js';

/**
 * 환경변수 검증.
 * 누락된 채로 silent fallback하면 운영에서 모호한 런타임 에러로 디버깅 시간만 잡아먹음.
 * 부팅 시 명시적으로 throw해서 plugin.zip 배포 전에 발견하도록 한다.
 */

export function requireEnv(name: string, value: string | undefined): string {
    if (value === undefined || value === null || value.trim() === '') {
        throw new Error(
            `[toss-pos-plugin] Missing required env: ${name}. ` +
            `Set in apps/toss-pos-plugin/.env (Vite는 PLUGIN_ 접두사 필수).`
        );
    }
    return value;
}

/**
 * API_URL은 dev에서는 localhost fallback 허용, prod 빌드에서는 명시적 URL 필수.
 * prod에 localhost가 박힌 채 plugin.zip이 배포되면 토스 POS가 호출 시 항상 실패.
 */
export function resolveApiUrl(value: string | undefined, isDev: boolean): string {
    const trimmed = value?.trim();
    if (!trimmed) {
        if (isDev) return 'http://localhost:4000/api/v1';
        throw new Error(
            '[toss-pos-plugin] Missing required env: PLUGIN_API_URL. ' +
            'Production build must point to a reachable HTTPS URL (localhost not allowed).'
        );
    }
    if (!isDev) {
        const isLocal = /^https?:\/\/(localhost|127\.0\.0\.1|0\.0\.0\.0)(:|\/|$)/i.test(trimmed);
        if (isLocal) {
            throw new Error(
                `[toss-pos-plugin] PLUGIN_API_URL points to localhost in production build (${trimmed}). ` +
                `Toss POS는 외부 호스트라 localhost에 도달 불가 — 실제 도메인으로 설정.`
            );
        }
    }
    return trimmed;
}

const isDev = import.meta.env.DEV;

export const API_URL = resolveApiUrl(import.meta.env.PLUGIN_API_URL as string | undefined, isDev);
export const SUPABASE_URL = requireEnv('PLUGIN_SUPABASE_URL', import.meta.env.PLUGIN_SUPABASE_URL as string | undefined);
export const SUPABASE_KEY = requireEnv('PLUGIN_SUPABASE_ANON_KEY', import.meta.env.PLUGIN_SUPABASE_ANON_KEY as string | undefined);
export const STORE_ID = requireEnv('PLUGIN_STORE_ID', import.meta.env.PLUGIN_STORE_ID as string | undefined);
export const POLLING_INTERVAL = 30_000;

export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
