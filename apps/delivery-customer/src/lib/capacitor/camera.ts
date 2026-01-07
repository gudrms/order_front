import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { isNative } from './index';

/**
 * 카메라로 사진 촬영
 */
export async function takePicture() {
  if (!isNative) {
    console.warn('카메라는 네이티브 앱에서만 사용 가능합니다.');
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Camera,
    });

    return image.webPath;
  } catch (error) {
    console.error('카메라 촬영 실패:', error);
    return null;
  }
}

/**
 * 갤러리에서 이미지 선택
 */
export async function pickImage() {
  if (!isNative) {
    console.warn('갤러리는 네이티브 앱에서만 사용 가능합니다.');
    return null;
  }

  try {
    const image = await Camera.getPhoto({
      quality: 90,
      allowEditing: true,
      resultType: CameraResultType.Uri,
      source: CameraSource.Photos,
    });

    return image.webPath;
  } catch (error) {
    console.error('이미지 선택 실패:', error);
    return null;
  }
}
