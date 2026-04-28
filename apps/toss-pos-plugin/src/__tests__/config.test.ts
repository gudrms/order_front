import { describe, it, expect, vi } from 'vitest';

// config.ts 모듈을 import하면 부팅 시점에 env 검증이 실행되므로
// 검증 함수만 직접 import해서 단위 테스트한다 (모듈 부팅 부작용 회피).
vi.mock('@supabase/supabase-js', () => ({
    createClient: vi.fn(() => ({})),
}));

import { requireEnv, resolveApiUrl } from '../config';

describe('requireEnv', () => {
    it('값이 있으면 그대로 반환한다', () => {
        expect(requireEnv('FOO', 'bar')).toBe('bar');
    });

    it('undefined이면 throw한다', () => {
        expect(() => requireEnv('FOO', undefined)).toThrow(/Missing required env: FOO/);
    });

    it('빈 문자열이면 throw한다', () => {
        expect(() => requireEnv('FOO', '')).toThrow(/Missing required env: FOO/);
    });

    it('공백만 있는 문자열이면 throw한다', () => {
        expect(() => requireEnv('FOO', '   ')).toThrow(/Missing required env: FOO/);
    });
});

describe('resolveApiUrl', () => {
    it('dev에서 값이 없으면 localhost fallback', () => {
        expect(resolveApiUrl(undefined, true)).toBe('http://localhost:4000/api/v1');
        expect(resolveApiUrl('', true)).toBe('http://localhost:4000/api/v1');
    });

    it('prod에서 값이 없으면 throw한다', () => {
        expect(() => resolveApiUrl(undefined, false)).toThrow(/Missing required env: PLUGIN_API_URL/);
        expect(() => resolveApiUrl('', false)).toThrow(/Missing required env: PLUGIN_API_URL/);
    });

    it('prod에서 localhost를 가리키면 throw한다 (POS가 외부에서 도달 불가)', () => {
        expect(() => resolveApiUrl('http://localhost:4000/api/v1', false))
            .toThrow(/PLUGIN_API_URL points to localhost/);
        expect(() => resolveApiUrl('http://127.0.0.1:4000', false))
            .toThrow(/PLUGIN_API_URL points to localhost/);
        expect(() => resolveApiUrl('http://0.0.0.0/api', false))
            .toThrow(/PLUGIN_API_URL points to localhost/);
        expect(() => resolveApiUrl('https://localhost:4000', false))
            .toThrow(/PLUGIN_API_URL points to localhost/);
    });

    it('prod에서 정상 https URL은 통과시킨다', () => {
        expect(resolveApiUrl('https://api.example.com/v1', false))
            .toBe('https://api.example.com/v1');
    });

    it('dev에서는 localhost URL도 명시되면 그대로 반환', () => {
        expect(resolveApiUrl('http://localhost:5000/custom', true))
            .toBe('http://localhost:5000/custom');
    });

    it('앞뒤 공백을 trim한다', () => {
        expect(resolveApiUrl('  https://api.example.com/v1  ', false))
            .toBe('https://api.example.com/v1');
    });
});
