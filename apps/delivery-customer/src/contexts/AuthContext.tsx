'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@order/shared';
import type { User, Session } from '@supabase/supabase-js';

interface AuthContextType {
    user: User | null;
    session: Session | null;
    loading: boolean;
    signInWithKakao: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // 초기 세션 확인
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        // 인증 상태 변화 감지
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const getRedirectUrl = () => {
        // 브라우저(클라이언트) 환경이면 현재 접속 중인 도메인을 그대로 사용
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/auth/callback`;
        }

        // Ensure development and production URLs are handled correctly
        let url =
            process?.env?.NEXT_PUBLIC_SITE_URL ?? // Set this to your site URL in production env.
            process?.env?.NEXT_PUBLIC_VERCEL_URL ?? // Automatically set by Vercel.
            'http://localhost:3001/';
        // Make sure to include `https://` when not localhost.
        url = url.startsWith('http') ? url : `https://${url}`;
        // Make sure to include a trailing `/`.
        url = url.endsWith('/') ? url : `${url}/`;

        // Return exactly what we want the callback to process
        return `${url}auth/callback`;
    };

    const signInWithKakao = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'kakao',
            options: {
                redirectTo: getRedirectUrl(),
            },
        });

        if (error) {
            console.error('카카오 로그인 오류:', error);
            throw error;
        }
    };

    const signInWithApple = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: {
                redirectTo: getRedirectUrl(),
            },
        });

        if (error) {
            console.error('Apple 로그인 오류:', error);
            throw error;
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('로그아웃 오류:', error);
            throw error;
        }
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                session,
                loading,
                signInWithKakao,
                signInWithApple,
                signOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
