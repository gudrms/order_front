# Capacitor 원격 WebView + 딥링크 실기기 테스트 가이드

## 1. 환경 설정

### 1-1. 로컬 개발 서버 실행 (PC)
```bash
# 배달앱 개발 서버 (실기기와 같은 네트워크에 있어야 함)
pnpm --filter delivery-customer dev   # → http://localhost:3001

# 백엔드 서버
pnpm --filter backend start           # → http://localhost:3000
```

### 1-2. CAPACITOR_SERVER_URL 설정
실기기 → 개발 서버로 원격 WebView 연결:
```bash
# PC의 내부 IP 확인 (예: 192.168.1.100)
ipconfig   # Windows
ifconfig   # macOS/Linux

# capacitor.config.ts 는 환경변수로 동적 설정
# .env.local 에 추가
CAPACITOR_SERVER_URL=http://192.168.1.100:3001
```

> ⚠️ `CAPACITOR_SERVER_URL` 이 설정된 상태로 `cap sync` 해야 `capacitor.config.json` 에 반영됨.

```bash
CAPACITOR_SERVER_URL=http://192.168.1.100:3001 npx cap sync android
```

---

## 2. Android 실기기 실행

### 2-1. 사전 조건
- [Android Studio](https://developer.android.com/studio) 설치
- 개발자 모드 + USB 디버깅 활성화된 기기

### 2-2. 빌드 & 실행
```bash
# Android Studio 로 프로젝트 열기
npx cap open android

# 또는 CLI 로 직접 실행 (기기 연결 후)
npx cap run android
```

### 2-3. 원격 WebView 확인
앱 실행 후 `http://192.168.1.100:3001/menu` 가 로드되면 성공.

---

## 3. 딥링크 테스트

### 3-1. Custom Scheme (taco://)

```bash
# adb 로 딥링크 트리거 (기기 연결 상태)
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "taco://orders/TEST_ORDER_ID" \
  com.taco.delivery

# 기대 결과: 앱이 열리고 /orders/TEST_ORDER_ID 페이지로 이동
```

### 3-2. HTTPS App Links (delivery.tacomole.kr)

```bash
adb shell am start \
  -W -a android.intent.action.VIEW \
  -d "https://delivery.tacomole.kr/orders/TEST_ORDER_ID" \
  com.taco.delivery
```

> ⚠️ HTTPS App Links 는 `assetlinks.json` 을 서버에 등록해야 최종 동작.
> 테스트 단계에서는 Custom Scheme 으로 확인 가능.

### 3-3. /orders/[id] 동적 라우트 딥링크 시나리오

| 딥링크 URL | 기대 경로 |
|---|---|
| `taco://orders/abc123` | `/orders/abc123` |
| `taco://mypage` | `/mypage` |
| `taco://mypage/coupons` | `/mypage/coupons` |
| `taco://orders` | `/orders` |

---

## 4. iOS 실기기 실행

### 4-1. 사전 조건
- macOS + Xcode 설치 필요
- CocoaPods 설치: `sudo gem install cocoapods`

### 4-2. CocoaPods 설치 후 sync
```bash
cd ios/App && pod install
npx cap sync ios
npx cap open ios
```

### 4-3. iOS 딥링크 테스트 (시뮬레이터)
```bash
# xcrun simctl 로 커스텀 스킴 열기
xcrun simctl openurl booted "taco://orders/TEST_ORDER_ID"
```

---

## 5. App Links 프로덕션 설정 (배포 전 필요)

### Android assetlinks.json
`https://delivery.tacomole.kr/.well-known/assetlinks.json` 에 배포:
```json
[{
  "relation": ["delegate_permission/common.handle_all_urls"],
  "target": {
    "namespace": "android_app",
    "package_name": "com.taco.delivery",
    "sha256_cert_fingerprints": ["YOUR_SIGNING_CERT_SHA256"]
  }
}]
```

### iOS apple-app-site-association
`https://delivery.tacomole.kr/.well-known/apple-app-site-association`:
```json
{
  "applinks": {
    "apps": [],
    "details": [{
      "appID": "TEAM_ID.com.taco.delivery",
      "paths": ["/orders/*", "/mypage/*"]
    }]
  }
}
```

---

## 6. 체크리스트

- [ ] `CAPACITOR_SERVER_URL` 설정 후 `cap sync android` 완료
- [ ] Android Studio 에서 앱 빌드 성공
- [ ] 실기기에서 원격 WebView 로드 확인 (개발 서버 URL)
- [ ] `adb shell am start -d "taco://orders/TEST_ID"` 딥링크 동작 확인
- [ ] `/orders/[id]` 페이지 정상 로드 확인
- [ ] 앱 백그라운드 → 딥링크 재진입 동작 확인
- [ ] iOS: `pod install` 후 Xcode 빌드 성공 (macOS 환경 필요)
