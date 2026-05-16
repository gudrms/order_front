'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api } from '@order/shared/api';
import { supabase } from '@order/shared/lib/supabase';
import type { Session, User } from '@supabase/supabase-js';
import {
    cleanupPushNotifications,
    getCurrentPushToken,
} from '@/lib/capacitor/push-notifications';
import { isNative } from '@/lib/capacitor';

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
    const syncedSessionKeyRef = useRef<string | null>(null);

    const syncSessionUser = async (nextSession: Session | null) => {
        if (!nextSession?.user) {
            syncedSessionKeyRef.current = null;
            return;
        }

        const sessionKey = `${nextSession.user.id}:${nextSession.access_token}`;
        if (syncedSessionKeyRef.current === sessionKey) {
            return;
        }

        const metadata = nextSession.user.user_metadata || {};
        try {
            await api.auth.syncCurrentUser({
                name: metadata.name || metadata.full_name || metadata.nickname,
                phoneNumber: metadata.phone_number || metadata.phone,
            });
            syncedSessionKeyRef.current = sessionKey;
        } catch (error) {
            console.error('사용자 동기화 실패:', error);
        }
    };

    const setAuthCookie = (authenticated: boolean) => {
        if (authenticated) {
            document.cookie = '_auth=1; path=/; SameSite=Lax; max-age=604800';
        } else {
            document.cookie = '_auth=; path=/; SameSite=Lax; max-age=0';
        }
    };

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            setAuthCookie(!!session);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
            // sync는 백그라운드에서 처리 — cold start 타임아웃이 loading을 블로킹하지 않도록
            // onAuthStateChange와 동일한 fire-and-forget 패턴
            void syncSessionUser(session);
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            window.setTimeout(() => {
                void syncSessionUser(session);
            }, 0);
            setAuthCookie(!!session);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
        });

        return () => subscription.unsubscribe();
    }, []);

    const getRedirectUrl = () => {
        if (typeof window !== 'undefined') {
            return `${window.location.origin}/auth/callback`;
        }

        let url =
            process?.env?.NEXT_PUBLIC_SITE_URL ??
            process?.env?.NEXT_PUBLIC_VERCEL_URL ??
            'http://localhost:3001/';
        url = url.startsWith('http') ? url : `https://${url}`;
        url = url.endsWith('/') ? url : `${url}/`;

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
        // 로그아웃 전 FCM 디바이스 토큰 삭제 (네이티브만)
        if (isNative) {
            const token = getCurrentPushToken();
            if (token) {
                try {
                    await api.devices.unregisterDevice(token);
                } catch {
                    // 토큰 삭제 실패는 로그아웃을 막지 않음
                }
            }
            await cleanupPushNotifications();
        }

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
