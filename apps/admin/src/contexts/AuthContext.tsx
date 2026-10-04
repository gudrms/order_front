'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { unregisterWebPush } from '@/hooks/useWebPush';
import { adminApi } from '@/lib/adminApi';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null; // DB의 유저 프로필 정보
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const fetchProfile = async (userId: string, token: string) => {
    try {
      const response = await adminApi.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setProfile(response.data);
    } catch (error) {
      console.error('Profile fetch failed:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    let revision = 0;
    let eventReceived = false;
    let profileRequest: AbortController | null = null;
    const deferred = new Set<ReturnType<typeof setTimeout>>();
    const applySession = async (nextSession: Session | null) => {
      if (!mounted) return;
      const currentRevision = ++revision;
      profileRequest?.abort();
      setSession(nextSession);
      setUser(nextSession?.user ?? null);
      if (!nextSession?.user) {
        setProfile(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      const controller = new AbortController();
      profileRequest = controller;
      try {
        const response = await adminApi.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
          headers: { Authorization: `Bearer ${nextSession.access_token}` },
          timeout: 10000,
          signal: controller.signal,
        });
        if (mounted && revision === currentRevision) setProfile(response.data);
      } catch (error) {
        if (mounted && revision === currentRevision) {
          console.error('Profile fetch failed:', error);
          setProfile(null);
        }
      } finally {
        if (mounted && revision === currentRevision) setLoading(false);
      }
    };
    const initializationTimeout = setTimeout(() => {
      if (mounted && !eventReceived) {
        console.error('인증 세션 초기화 시간이 초과되었습니다. 다시 로그인해 주세요.');
        void applySession(null);
      }
    }, 15000);

    // Keep the auth callback synchronous. Defer network work until the auth storage lock is released.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, nextSession) => {
      eventReceived = true;
      clearTimeout(initializationTimeout);
      const timer = setTimeout(() => {
        deferred.delete(timer);
        void applySession(nextSession);
        if (event === 'SIGNED_OUT' && mounted) router.push('/login');
      }, 0);
      deferred.add(timer);
    });
    void supabase.auth.getSession().then(({ data, error }) => {
      if (error) throw error;
      if (!eventReceived) {
        clearTimeout(initializationTimeout);
        void applySession(data.session);
      }
    }).catch((error) => {
      if (!mounted) return;
      console.error('인증 세션 확인에 실패했습니다:', error);
      if (!eventReceived) {
        clearTimeout(initializationTimeout);
        void applySession(null);
      }
    });
    return () => {
      mounted = false;
      revision += 1;
      clearTimeout(initializationTimeout);
      deferred.forEach(clearTimeout);
      profileRequest?.abort();
      subscription.unsubscribe();
    };
  }, [router]);

  const signOut = async () => {
    // 웹 푸시 토큰 해제 (로그아웃 전에 먼저 처리)
    if (session?.access_token) {
      await unregisterWebPush(session.access_token);
    }
    await supabase.auth.signOut();
    router.push('/login');
  };

  const refreshProfile = async () => {
    if (user && session) {
      await fetchProfile(user.id, session.access_token);
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, profile, loading, signOut, refreshProfile }}>
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
