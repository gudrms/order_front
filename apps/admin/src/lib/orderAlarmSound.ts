import type { MutableRefObject } from 'react';

export const ALERT_ENABLED_KEY = 'admin.orderAlerts.enabled';
export const SOUND_ENABLED_KEY = 'admin.orderAlerts.soundEnabled';

/**
 * 새 주문 알림음 (딩-동 두 번).
 * 브라우저는 사용자가 화면을 한 번이라도 클릭해야 소리를 낼 수 있다 (PC 앱은 이 제한을 끈다).
 * @returns 실제로 소리를 낼 수 있는 상태인지 — false면 "화면을 클릭해 소리 켜기" 안내가 필요하다
 */
export function playOrderAlarmTone(audioContextRef: MutableRefObject<AudioContext | null>): boolean {
  if (typeof window === 'undefined') return false;

  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) return false;

  const context = audioContextRef.current || new AudioContextClass();
  audioContextRef.current = context;

  if (context.state === 'suspended') {
    void context.resume();
  }

  const beep = (frequency: number, startAt: number) => {
    const oscillator = context.createOscillator();
    const gain = context.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(frequency, startAt);
    gain.gain.setValueAtTime(0.0001, startAt);
    gain.gain.exponentialRampToValueAtTime(0.35, startAt + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.0001, startAt + 0.4);
    oscillator.connect(gain);
    gain.connect(context.destination);
    oscillator.start(startAt);
    oscillator.stop(startAt + 0.42);
  };
  beep(988, context.currentTime);
  beep(784, context.currentTime + 0.45);

  return context.state === 'running';
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
