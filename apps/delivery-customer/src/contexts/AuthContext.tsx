'use client';

import { createContext, useContext, useEffect, useRef, useState } from 'react';
import { api, supabase } from '@order/shared';
import type { Session, User } from '@supabase/supabase-js';

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
        supabase.auth.getSession().then(async ({ data: { session } }) => {
            await syncSessionUser(session);
            setAuthCookie(!!session);
            setSession(session);
            setUser(session?.user ?? null);
            setLoading(false);
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
