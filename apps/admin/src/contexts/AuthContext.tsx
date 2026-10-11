'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { unregisterWebPush } from '@/hooks/useWebPush';
import { adminApi } from '@/lib/adminApi';
import { shouldExpireSession } from '@/lib/loginPreferences';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: any | null; // DB의 유저 프로필 정보
  loading: boolean;
  /** /auth/me가 서버 장애(응답 없음·5xx)로 실패했다 — 권한 없음과 구분한다 */
  profileError: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** 서버 장애를 "프로필 없음"으로 처리하면 모든 계정이 승인 대기 화면으로 잘못 보내진다 */
function isServerFailure(error: unknown) {
  return axios.isAxiosError(error) && (!error.response || error.response.status >= 500);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [profileError, setProfileError] = useState(false);
  const router = useRouter();

  const fetchProfile = async (userId: string, token: string) => {
    try {
      const response = await adminApi.get(`${process.env.NEXT_PUBLIC_API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        timeout: 10000,
      });
      setProfile(response.data);
      setProfileError(false);
    } catch (error) {
      console.error('Profile fetch failed:', error);
      setProfile(null);
      setProfileError(isServerFailure(error));
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
        setProfileError(false);
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
        if (mounted && revision === currentRevision) {
          setProfile(response.data);
          setProfileError(false);
        }
      } catch (error) {
        if (mounted && revision === currentRevision) {
          console.error('Profile fetch failed:', error);
          setProfile(null);
          setProfileError(isServerFailure(error));
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

    // 로그인 상태 유지를 끈 채 로그인했다면 브라우저·PC 앱을 다시 켰을 때 남은 세션을 버린다 (SIGNED_OUT → 로그인 화면)
    if (shouldExpireSession()) void supabase.auth.signOut({ scope: 'local' });

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
    <AuthContext.Provider value={{ user, session, profile, loading, profileError, signOut, refreshProfile }}>
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
