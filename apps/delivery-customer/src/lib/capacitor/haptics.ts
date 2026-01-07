import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { isNative } from './index';

/**
 * 진동 피드백 (가벼운 터치)
 */
export async function hapticsLight() {
  if (!isNative) return;

  try {
    await Haptics.impact({ style: ImpactStyle.Light });
  } catch (error) {
    console.error('진동 실패:', error);
  }
}

/**
 * 진동 피드백 (보통)
 */
export async function hapticsMedium() {
  if (!isNative) return;

  try {
    await Haptics.impact({ style: ImpactStyle.Medium });
  } catch (error) {
    console.error('진동 실패:', error);
  }
}

/**
 * 진동 피드백 (강함)
 */
export async function hapticsHeavy() {
  if (!isNative) return;

  try {
    await Haptics.impact({ style: ImpactStyle.Heavy });
  } catch (error) {
    console.error('진동 실패:', error);
  }
}

/**
 * 알림 진동 (성공)
 */
export async function hapticsSuccess() {
  if (!isNative) return;

  try {
    await Haptics.notification({ type: NotificationType.Success });
  } catch (error) {
    console.error('진동 실패:', error);
  }
}

/**
 * 알림 진동 (경고)
 */
export async function hapticsWarning() {
  if (!isNative) return;

  try {
    await Haptics.notification({ type: NotificationType.Warning });
  } catch (error) {
    console.error('진동 실패:', error);
  }
}

/**
 * 알림 진동 (에러)
 */
export async function hapticsError() {
  if (!isNative) return;

  try {
    await Haptics.notification({ type: NotificationType.Error });
  } catch (error) {
    console.error('진동 실패:', error);
  }
}
