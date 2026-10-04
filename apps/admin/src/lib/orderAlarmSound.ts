export const ALERT_ENABLED_KEY = 'admin.orderAlerts.enabled';
export const SOUND_ENABLED_KEY = 'admin.orderAlerts.soundEnabled';
export const ORDER_ALERT_SETTINGS_EVENT = 'admin:order-alert-settings';
let alarmAudio: HTMLAudioElement | null = null;

/** Shared recorded Korean voice: avoid overlapping playback and report autoplay failures. */
export async function playOrderAlarmVoice(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  alarmAudio ??= new Audio('/audio/pending-order.wav');
  if (!alarmAudio.paused) return true;
  alarmAudio.currentTime = 0;
  try {
    await alarmAudio.play();
    return true;
  } catch {
    return false;
  }
}

export function stopOrderAlarmVoice() {
  alarmAudio?.pause();
  if (alarmAudio) alarmAudio.currentTime = 0;
}

// Staff-call audio still uses Web Audio.
declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}
