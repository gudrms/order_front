# Delivery Customer App

배달 주문 고객용 웹/앱 (Next.js + Capacitor)

## 🎯 개요

- **웹**: PWA로 브라우저에서 접속 가능
- **앱**: Capacitor로 iOS/Android 네이티브 앱 빌드

## 🛠️ 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Styling**: TailwindCSS 4
- **State**: Zustand + TanStack Query
- **Native**: Capacitor 6
- **PWA**: Progressive Web App 지원

## 🚀 개발 서버 실행

### 웹 개발 (일반)

```bash
cd apps/delivery-customer
pnpm dev
```

→ http://localhost:3001

### 앱 개발 (Capacitor)

```bash
# 1. 웹 빌드 및 네이티브 동기화
pnpm cap:sync

# 2. Android 앱 실행
pnpm android
# 또는
pnpm cap:open:android

# 3. iOS 앱 실행 (Mac 필요)
pnpm ios
# 또는
pnpm cap:open:ios
```

## 📱 Capacitor 초기 설정 (최초 1회)

### 1. Android 프로젝트 추가

```bash
pnpm cap:add:android
```

**필요한 것:**
- Android Studio 설치
- Android SDK 설치

### 2. iOS 프로젝트 추가 (Mac만)

```bash
pnpm cap:add:ios
```

**필요한 것:**
- macOS
- Xcode 설치
- CocoaPods 설치 (`sudo gem install cocoapods`)

## 📦 사용 가능한 Native 기능

### 1. 카메라

```typescript
import { takePicture, pickImage } from '@/lib/capacitor/camera';

// 사진 촬영
const imageUrl = await takePicture();

// 갤러리에서 선택
const imageUrl = await pickImage();
```

### 2. 위치 정보 (GPS)

```typescript
import { getCurrentPosition, requestPermissions } from '@/lib/capacitor/geolocation';

// 권한 요청
await requestPermissions();

// 현재 위치
const position = await getCurrentPosition();
console.log(position.latitude, position.longitude);
```

### 3. 푸시 알림

```typescript
import { initPushNotifications } from '@/lib/capacitor/push-notifications';

// 앱 시작 시 초기화
await initPushNotifications();
```

### 4. 상태바 (Status Bar)

```typescript
import { setStatusBarStyle } from '@/lib/capacitor/status-bar';

// 다크 모드
await setStatusBarStyle('dark');
```

### 5. 플랫폼 체크

```typescript
import { platform } from '@/lib/capacitor';

if (platform.isNative) {
  // 네이티브 앱에서만 실행
}

if (platform.isWeb) {
  // 웹 브라우저에서만 실행
}

if (platform.isIOS) {
  // iOS 전용
}

if (platform.isAndroid) {
  // Android 전용
}
```

## 🧪 Native 기능 테스트

테스트 페이지: http://localhost:3001/test-native

→ 카메라, 위치, 플랫폼 정보 등을 테스트할 수 있습니다.

## 📋 주요 명령어

| 명령어 | 설명 |
|--------|------|
| `pnpm dev` | 웹 개발 서버 (localhost:3001) |
| `pnpm build` | Next.js 빌드 |
| `pnpm export` | Static Export (Capacitor용) |
| `pnpm cap:sync` | 웹 빌드 → 네이티브 동기화 |
| `pnpm cap:open:android` | Android Studio 열기 |
| `pnpm cap:open:ios` | Xcode 열기 (Mac) |
| `pnpm android` | Android 앱 빌드 및 실행 |
| `pnpm ios` | iOS 앱 빌드 및 실행 (Mac) |

## 🔧 Capacitor 설정

### capacitor.config.ts

```typescript
{
  appId: 'com.yourbrand.delivery',    // 앱 고유 ID
  appName: '우리브랜드 배달',          // 앱 이름
  webDir: 'out',                       // Next.js export 폴더
}
```

→ 앱 ID와 이름은 `capacitor.config.ts`에서 수정하세요.

## 📱 앱 배포

### Android (Play Store)

```bash
# 1. 빌드
pnpm cap:sync

# 2. Android Studio 열기
pnpm cap:open:android

# 3. Android Studio에서:
# - Build → Generate Signed Bundle / APK
# - Release AAB 생성
# - Google Play Console에 업로드
```

### iOS (App Store) - Mac 필요

```bash
# 1. 빌드
pnpm cap:sync

# 2. Xcode 열기
pnpm cap:open:ios

# 3. Xcode에서:
# - Product → Archive
# - Distribute App
# - App Store Connect 업로드
```

## 🌐 웹 배포 (Vercel)

```bash
# Vercel에 배포 (웹으로만)
pnpm build
# → Vercel이 자동으로 배포
```

**주의**: Capacitor는 웹 배포에 영향 없음. 웹과 앱 모두 지원.

## 📂 프로젝트 구조

```
apps/delivery-customer/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── page.tsx           # 메인 페이지
│   │   ├── test-native/       # Native 기능 테스트
│   │   └── layout.tsx
│   │
│   ├── lib/
│   │   └── capacitor/         # Capacitor 유틸
│   │       ├── index.ts       # 플랫폼 체크
│   │       ├── camera.ts      # 카메라
│   │       ├── geolocation.ts # 위치
│   │       ├── push-notifications.ts
│   │       └── status-bar.ts
│   │
│   ├── components/
│   └── hooks/
│
├── public/                     # 정적 파일
├── out/                        # Next.js export (빌드 결과)
│
├── android/                    # Android 프로젝트 (자동 생성)
├── ios/                        # iOS 프로젝트 (자동 생성, Mac)
│
├── capacitor.config.ts        # Capacitor 설정
├── next.config.ts             # Next.js 설정
└── package.json
```

## ⚠️ 주의사항

### 1. Next.js 제한사항

Capacitor는 **Static Export**만 지원합니다.

**사용 불가:**
- Server Components (모두 Client Component로 변경)
- API Routes (`/api/*`)
- Dynamic Routes with `generateStaticParams` 없이
- Image Optimization (`images.unoptimized: true` 필수)

**대신 사용:**
- Client Components (`'use client'`)
- 외부 API 호출 (백엔드 API)
- Static Routes

### 2. 웹 vs 앱 차이

```typescript
// 웹에서는 작동 안 함
if (platform.isNative) {
  await takePicture();  // ✅ 앱에서만
}

// 웹에서는 브라우저 API 사용
if (platform.isWeb) {
  navigator.geolocation.getCurrentPosition();  // ✅ 웹에서만
}
```

### 3. 개발 워크플로우

```bash
# 웹 개발 (빠름)
pnpm dev  # 평소처럼 개발

# 네이티브 기능 테스트 (느림)
pnpm cap:sync  # 변경사항 반영
pnpm android   # 앱에서 실행
```

→ 웹 개발로 대부분 작업 후, 네이티브 기능만 앱에서 테스트 추천!

## 🐛 문제 해결

### Android Studio에서 빌드 실패

```bash
cd android
./gradlew clean
cd ..
pnpm cap:sync
```

### iOS 빌드 실패 (Mac)

```bash
cd ios/App
pod install
cd ../..
pnpm cap:sync
```

### 네이티브 플러그인 추가 후 동작 안 함

```bash
pnpm cap:sync  # 항상 sync 필수!
```

## 📚 참고 문서

- [Capacitor 공식 문서](https://capacitorjs.com/)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [Next.js Static Export](https://nextjs.org/docs/app/building-your-application/deploying/static-exports)

## 🎉 다음 단계

1. ✅ Capacitor 설정 완료
2. ⏸️ 앱 디자인 및 기능 개발
3. ⏸️ Android 앱 빌드 (Windows 가능)
4. ⏸️ Play Store 제출
5. ⏸️ iOS 앱 빌드 (나중에, Mac 필요)
6. ⏸️ App Store 제출
