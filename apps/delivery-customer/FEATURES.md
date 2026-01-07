# 배달앱 기능 목록

## ✅ 구현된 Native 기능

### 1. 📸 카메라
- **용도**: 리뷰 사진, 영수증 촬영
- **사용법**: `takePicture()`, `pickImage()`
- **위치**: `src/lib/capacitor/camera.ts`

### 2. 📍 위치 정보 (GPS)
- **용도**: 현재 위치, 배달 주소 자동 입력
- **사용법**: `getCurrentPosition()`, `requestPermissions()`
- **위치**: `src/lib/capacitor/geolocation.ts`

### 3. 🔔 푸시 알림
- **용도**: 주문 상태 알림 (접수, 조리, 배달 중, 도착)
- **사용법**: `initPushNotifications()`
- **위치**: `src/lib/capacitor/push-notifications.ts`

### 4. 📳 진동 피드백 (Haptics)
- **용도**: 버튼 클릭, 알림 피드백
- **사용법**: `hapticsSuccess()`, `hapticsMedium()`, `hapticsHeavy()`
- **위치**: `src/lib/capacitor/haptics.ts`

### 5. 🔔 로컬 알림
- **용도**: 배달 도착 알림, 예약 알림
- **사용법**: `showNotification()`, `scheduleNotification()`
- **위치**: `src/lib/capacitor/local-notifications.ts`

### 6. 🌐 네트워크 상태
- **용도**: 오프라인 감지, 네트워크 끊김 알림
- **사용법**: `getNetworkStatus()`, `addNetworkListener()`
- **위치**: `src/lib/capacitor/network.ts`

### 7. 📤 공유하기
- **용도**: 친구 추천, 주문 공유
- **사용법**: `shareApp()`, `shareOrder()`
- **위치**: `src/lib/capacitor/share.ts`

### 8. 💬 토스트 메시지
- **용도**: 간단한 알림 메시지
- **사용법**: `showSuccessToast()`, `showErrorToast()`
- **위치**: `src/lib/capacitor/toast.ts`

### 9. 🌐 인앱 브라우저
- **용도**: 약관, 공지사항, 고객센터
- **사용법**: `openBrowser()`, `openTerms()`, `openPrivacyPolicy()`
- **위치**: `src/lib/capacitor/browser.ts`

### 10. 📱 앱 상태 관리
- **용도**: Foreground/Background 감지, 뒤로 가기 버튼
- **사용법**: `addAppStateListener()`, `addBackButtonListener()`
- **위치**: `src/lib/capacitor/app.ts`

### 11. 🎨 상태바
- **용도**: 상태바 스타일 변경
- **사용법**: `setStatusBarStyle()`, `setStatusBarBackgroundColor()`
- **위치**: `src/lib/capacitor/status-bar.ts`

### 12. 🔍 플랫폼 체크
- **용도**: 웹/앱 분기 처리
- **사용법**: `platform.isNative`, `platform.isIOS`, `platform.isAndroid`
- **위치**: `src/lib/capacitor/index.ts`

## 🚚 배달 기능

### 배달 추적
- **상태**: 접수 → 조리 중 → 배달 중 → 도착 → 완료
- **기능**:
  - 실시간 배달 상태 업데이트
  - 예상 도착 시간
  - 배달 타임라인
  - 라이더 정보
  - 라이더 전화 걸기
  - 각 단계별 푸시 알림
  - 진동 피드백
- **위치**: `src/features/delivery-tracking/`

### 배달 알림 시나리오
1. **접수 완료** → 푸시 알림 + 진동
2. **조리 시작** → 푸시 알림
3. **조리 완료** → 푸시 알림 + 진동
4. **배달 시작** → 푸시 알림 + 진동
5. **도착 임박** (1분 전) → 로컬 알림 + 진동
6. **라이더 도착** → 푸시 알림 + 강한 진동 + 소리

## 💳 결제 기능

### 지원 결제 수단
- ✅ 신용/체크카드
- ✅ 카카오페이
- ✅ 네이버페이
- ✅ 토스
- ✅ 삼성페이
- ✅ 페이코
- ✅ 현금 (만나서 결제)

### 결제 흐름
1. 장바구니 → 주문서 작성
2. 결제 수단 선택
3. 결제 진행 (각 PG사 SDK)
4. 결제 완료 → 주문 접수
5. 영수증 표시

**위치**: `src/features/payment/`

**NOTE**: 실제 PG사 연동은 각 사의 SDK를 추가로 설치해야 합니다.
- 토스페이먼츠: https://docs.tosspayments.com/
- 포트원: https://portone.io/

## 📱 주요 사용 시나리오

### 시나리오 1: 주문하기
```typescript
1. 메뉴 선택
2. 장바구니 추가 (hapticsMedium 진동)
3. 주소 입력 (getCurrentPosition으로 자동 입력)
4. 결제 수단 선택
5. 결제 (processPayment)
6. 주문 완료 (hapticsSuccess 진동 + showSuccessToast)
7. 푸시 알림 권한 요청 (initPushNotifications)
```

### 시나리오 2: 배달 추적
```typescript
1. 주문 완료 후 배달 추적 화면 이동
2. useDeliveryTracking Hook 사용
3. Realtime으로 배달 상태 수신
4. 각 단계별 푸시 알림 + 진동
5. 라이더 도착 시 강한 진동 (hapticsHeavy)
```

### 시나리오 3: 친구 추천
```typescript
1. 설정 → 친구 추천
2. shareApp() 호출
3. 카카오톡, 문자 등으로 공유
```

### 시나리오 4: 오프라인 감지
```typescript
1. addNetworkListener로 네트워크 상태 감지
2. 오프라인 시 "인터넷 연결 없음" 토스트
3. 온라인 복귀 시 자동 재연결
```

## 🎯 향후 추가 가능한 기능

### 우선순위 높음
- [ ] 실시간 배달 지도 (Google Maps / Naver Maps)
- [ ] 채팅 (고객 ↔ 매장)
- [ ] 음성 알림 (TTS)
- [ ] 생체 인증 (지문, Face ID)

### 우선순위 중간
- [ ] QR 코드 스캔 (쿠폰, 포인트)
- [ ] 캘린더 (예약 주문)
- [ ] 파일 다운로드 (영수증 PDF)
- [ ] 클립보드 (주문번호 복사)

### 우선순위 낮음
- [ ] 앱 리뷰 유도 (App Rate)
- [ ] 앱 업데이트 체크
- [ ] 스크린샷 차단 (보안)

## 📚 참고 문서

- [Capacitor 공식 문서](https://capacitorjs.com/)
- [Capacitor Plugins](https://capacitorjs.com/docs/plugins)
- [배달앱 README](./README.md)
