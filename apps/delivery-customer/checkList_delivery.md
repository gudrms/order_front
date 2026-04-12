# 배달 앱 (Delivery Customer) 개발 체크리스트

> **현재 상태**: Phase 1 완료 (100%), Phase 2 진행 중 (90%), 고도화 분석 완료  
> **최종 업데이트**: 2026-04-12

## 🎯 개발 전략: PWA First, Native App Later

### Phase 1: PWA (Progressive Web App) ✅ 완료
- 브라우저를 통해 즉시 서비스 가능
- "홈 화면에 추가"를 통해 앱과 유사한 UX 제공
- Capacitor 플러그인 중 웹 지원 가능한 기능 우선 구현

### Phase 2: Native App (Capacitor) 🔄 진행 중
- PWA 안정화 후 Android/iOS 빌드
- 푸시 알림(FCM), 딥링크 등 네이티브 전용 기능 고도화
- 스토어 배포 (상세 내용: [DEPLOYMENT.md](./DEPLOYMENT.md) 참고)

---

## ✅ Phase 1: 핵심 기능 구현 (완료)

### 1.1 홈 화면
- [x] HomeHeader (헤더)
- [x] Dashboard (포인트/쿠폰 현황)
- [x] ServiceButtons (주문 방식 선택: 배달/포장/매장)
- [x] QuickMenu (원클릭 주문, 선물하기)
- [x] BottomNav (네비게이션)

### 1.2 메뉴 & 주문
- [x] 메뉴 페이지 (/menu)
- [x] CategoryTabs (카테고리 탭, Sticky)
- [x] MenuList (메뉴 리스트 + 필터링)
- [x] MenuDetailBottomSheet (옵션 선택)
- [x] CartBottomSheet (장바구니)
- [x] 수량 조절 및 삭제
- [x] 최소 주문 금액 확인 (15,000원)

### 1.3 배달 주소
- [x] AddressInputBottomSheet (배달 정보 입력)
- [x] Daum 우편번호 서비스 연동 (packages/shared)
- [x] 주문자 정보 입력 (이름, 전화번호)
- [x] 배달 요청사항 입력

### 1.4 결제
- [x] 토스페이먼츠 SDK 설치 (packages/shared)
- [x] 결제 페이지 (/order/checkout)
- [x] 결제 방법 선택 (카드/만나서결제)
- [x] 토스페이먼츠 연동
- [x] 주문 생성 API
- [x] 결제 성공 페이지 (/order/success)
- [x] 결제 실패 페이지 (/order/fail)
- [x] 주문 완료 페이지 (/order/complete)

### 1.5 주문 내역
- [x] 주문 내역 페이지 (/orders)
- [x] 주문 상태별 아이콘/색상 (정의 및 연동 완료)
- [x] 빈 상태 처리
- [x] useOrders Hook (React Query)
- [x] 주문 데이터 모델 정합성 수정 (totalPrice, unitPrice 필드 통일)

### 1.6 PWA 설정
- [x] manifest.json 생성
- [x] Service Worker (sw.js)
- [x] PWAInstaller 컴포넌트 (앱 설치 배너)
- [x] Layout 메타데이터 설정
- [x] 다양한 크기의 아이콘 생성 및 배치
- [x] Apple Touch Icon 설정
- [x] Mobile-First 디자인 최적화

### 1.7 Capacitor 네이티브 플러그인
- [x] Camera (카메라 접근)
- [x] Geolocation (위치 서비스)
- [x] Push Notifications (푸시 알림 준비)
- [x] Status Bar (상태바 스타일)
- [x] Haptics (햅틱 피드백)
- [x] Local Notifications (로컬 알림)
- [x] Network (네트워크 상태 감지, 비동기 리스너 해제 개선)
- [x] Share (공유하기)
- [x] Toast (토스트 메시지)
- [x] Browser (인앱 브라우저)
- [x] App (앱 생명주기, 비동기 리스너 해제 개선)

### 1.8 Shared Packages
- [x] API Client (GET, POST, PATCH, PUT, DELETE)
- [x] Cart Store (Zustand)
- [x] Menu Selection Hook
- [x] Daum Postcode (주소 검색)
- [x] Toss Payments (결제)
- [x] Supabase Client (인증)
- [x] Types 체계 정리 및 버그 수정
  - [x] CreateOrderRequest (Table/Delivery 유니온 타입)
  - [x] OrderStatus 상태 확장 (PAID, DELIVERING 등)
  - [x] PaymentOrderItemInput / PaymentOrderResponse
  - [x] 레거시 호환 alias 추가
- [x] Validation & Format Utils
- [x] ENV_MANAGEMENT.md (환경 변수 관리 문서)

---

## 🔄 Phase 2: 고급 기능 (진행 중)

### 2.1 로그인/인증 (80% 완료)
- [x] Supabase Auth 설정 (packages/shared)
- [x] AuthContext & AuthProvider (자동 로그인)
- [x] 카카오 로그인 UI & 연동
- [x] Apple 로그인 뼈대 (iOS 앱 출시용)
- [x] 로그인 페이지 (/login)
- [x] OAuth 콜백 처리 (/auth/callback)
- [x] 로그아웃 기능
- [x] AUTH_SETUP.md 문서화
- [ ] 카카오 Developer 앱 등록 (실제 배포용)
- [ ] Supabase Dashboard에서 Kakao Provider 설정
- [ ] Apple Developer 등록 (iOS 앱 출시 시)

**로그인 구현 방식**
```typescript
// 1. 휴대폰 OTP 인증 (추천)
await supabase.auth.signInWithOtp({
  phone: '+821012345678',
})

// 2. 자동 로그인 (Refresh Token)
const { data: { session } } = await supabase.auth.getSession()

// 3. 소셜 로그인 (카카오/애플)
await supabase.auth.signInWithOAuth({
  provider: 'kakao',
})
```

### 2.2 주문 추적 (완료)
- [x] 실시간 주문 상태 업데이트 (Supabase Realtime)
- [x] 배달 진행 상황 UI (OrderStatusTracker)
- [x] 주문 상세 페이지 (/orders/[id])
- [x] 배달 완료 알림 (Local Notification)

### 2.3 사용자 기능 (완료)
- [x] 마이페이지 (/mypage)
- [x] 배달 주소 목록 관리 (CRUD + Daum Postcode)
- [x] 찜한 메뉴 (Favorites)
- [x] 최근 주문 내역
- [ ] 쿠폰/포인트 관리 (UI만 구현)
- [ ] 회원 정보 수정

### 2.4 리뷰 & 공유 (계획)
- [ ] 리뷰 작성 (카메라 연동)
- [ ] 리뷰 목록 조회
- [ ] 공유하기 기능 (Web Share API / Capacitor Share)
- [ ] 선물하기 기능

### 2.5 고객 지원 (계획)
- [ ] 고객센터/FAQ
- [ ] 1:1 문의
- [ ] 주문 취소/변경 요청
- [ ] 배달비 계산 로직 (거리 기반)

---

## 📱 Phase 3: Native App 고도화 (향후)

### 3.1 Capacitor 환경 구축
- [x] capacitor.config.ts 설정
- [x] Android 프로젝트 생성 (android/)
- [ ] iOS 프로젝트 생성 (ios/, Mac 필요)
- [ ] `npx cap sync` 자동화

### 3.2 네이티브 전용 기능
- [ ] **푸시 알림 (FCM)**
  - [ ] Firebase 프로젝트 설정
  - [ ] Android FCM 연동
  - [ ] iOS APNS 연동
  - [ ] 알림 권한 처리
  - [ ] 주문 상태 변경 알림
  - [ ] 프로모션 알림

- [ ] **딥링크 (Deep Linking)**
  - [ ] Universal Links (iOS) 설정
  - [ ] App Links (Android) 설정
  - [ ] 공유 링크 → 앱 자동 실행

- [ ] **바이오 인증**
  - [ ] Face ID / Touch ID (iOS)
  - [ ] 지문 인식 (Android)
  - [ ] 간편 로그인 옵션

- [ ] **카메라 고급 기능**
  - [ ] 네이티브 카메라 UI
  - [ ] 사진 편집 (크롭, 필터)
  - [ ] 다중 사진 업로드

### 3.3 스토어 배포
- [ ] **Android**
  - [ ] 스플래시 스크린 디자인
  - [ ] Keystore 생성 및 관리
  - [ ] AAB 빌드
  - [ ] Google Play Console 업로드
  - [ ] 스토어 등록 정보 작성
  - [ ] 심사 제출

- [ ] **iOS**
  - [ ] 스플래시 스크린 디자인
  - [ ] Apple Developer 계정 등록
  - [ ] Bundle Identifier 설정
  - [ ] Archive 생성
  - [ ] App Store Connect 업로드
  - [ ] 스토어 등록 정보 작성
  - [ ] 심사 제출

> 📘 **상세 배포 가이드**: [DEPLOYMENT.md](./DEPLOYMENT.md) 참고

### 3.4 앱 최적화
- [ ] 앱 번들 크기 최적화
- [ ] 네이티브 성능 프로파일링
- [ ] 메모리 누수 점검
- [ ] 배터리 사용량 최적화

---

## 🚀 고도화 체크리스트 (2026-04-12 분석)

### 🔴 즉시 해결 (기반 정리)
- [ ] **Store ID 하드코딩 제거** — `'store-1'` → Store Context/URL 파라미터로 동적 처리
    - [ ] `useMenus.ts` Store ID 동적 전달
    - [ ] `CheckoutPage.tsx` Store ID 동적 전달
    - [ ] `/order/success` Store ID 동적 전달
    - [ ] 홈화면 매장 선택 UI 추가
    - [ ] 사용자 마지막 매장 저장 (localStorage or DB)
- [ ] **주문내역 실제 API 연동** — `useOrders`가 localStorage Mock 사용 중 → 백엔드 API 연결
- [ ] **결제 보안 강화**
    - [ ] Success 페이지 결제 검증 로직 보완
    - [ ] 멱등성 키(idempotency key) 추가 — 중복 주문 방지
    - [ ] 결제 타임아웃 처리
- [ ] **타입 에러 수정** — `order-detail/page.tsx`의 `as any` 타입 단언 제거

### 🟠 핵심 기능 추가
- [ ] **주문 취소/환불**
    - [ ] 주문 상세에서 취소 버튼 추가
    - [ ] 취소 사유 선택 UI
    - [ ] 취소 API 연동 (백엔드 + Toss 환불)
    - [ ] 취소 상태 표시
- [ ] **메뉴 검색**
    - [ ] 메뉴 페이지 검색바 추가
    - [ ] 전문검색(full-text search) 또는 클라이언트 필터
    - [ ] 검색 결과 페이지
- [ ] **실시간 배달 추적 활성화**
    - [ ] `useDeliveryTracking` Supabase Realtime 구독 주석 해제 및 연결
    - [ ] 주문 상태 변경 시 푸시 알림 연동
- [ ] **푸시 알림 (FCM)**
    - [ ] Firebase 프로젝트 설정
    - [ ] 디바이스 토큰 등록 API
    - [ ] 주문 상태 변경 알림
    - [ ] 알림 탭 시 해당 주문으로 이동
- [ ] **UX 개선**
    - [ ] 토스트 알림 구현 (장바구니 추가 성공 등) — 현재 TODO 상태
    - [ ] `alert()` → Error Boundary + 재시도 UI 전환
    - [ ] 로딩 스켈레톤 일관성 개선
    - [ ] 빈 상태 일러스트 추가
- [ ] **API 통합 패턴 정리**
    - [ ] raw `fetch()` → `api.*` 클라이언트로 통일
    - [ ] React Query retry/에러 처리 설정 강화
    - [ ] 인증 헤더 인터셉터 추가

### 🟡 고도화 기능
- [ ] **리뷰 시스템**
    - [ ] 배달 완료 후 리뷰 작성 페이지
    - [ ] 별점 + 사진 업로드 (카메라 연동)
    - [ ] 리뷰 목록 조회
- [ ] **배달 지도**
    - [ ] Kakao/Naver Maps 연동
    - [ ] 라이더 실시간 위치 표시
    - [ ] 예상 도착 시간(ETA) 계산 — 현재 "30-40분" 하드코딩
    - [ ] 배달 경로 표시
- [ ] **쿠폰/포인트**
    - [ ] 쿠폰 코드 입력/적용 로직
    - [ ] 포인트 적립/사용
    - [ ] 쿠폰 관리 페이지
- [ ] **인앱 채팅**
    - [ ] 매장/라이더 채팅
    - [ ] 메시지 히스토리
- [ ] **결제 수단 확장**
    - [ ] Apple Pay / Google Pay
    - [ ] 간편결제 (네이버페이, 카카오페이)

### 🟢 장기 과제
- [ ] **성능 최적화**
    - [ ] 이미지 최적화 (현재 `unoptimized: true`)
    - [ ] 라우트 기반 코드 스플리팅
    - [ ] 주문/주소 목록 페이지네이션
    - [ ] 번들 사이즈 분석 및 최적화
- [ ] **다크 모드**
- [ ] **오프라인 캐싱** (메뉴 데이터 캐시, 오프라인 큐)
- [ ] **접근성 (a11y)** — ARIA 레이블, 키보드 네비게이션
- [ ] **iOS/Android 앱스토어 배포**

---

## 📊 진행률

| 카테고리 | 진행률 | 상태 |
|---------|--------|------|
| **Phase 1: 핵심 기능** | **100%** | ✅ 완료 |
| 홈 화면 | 100% | ✅ |
| 메뉴 & 주문 | 100% | ✅ |
| 배달 주소 | 100% | ✅ |
| 결제 | 100% | ✅ |
| 주문 내역 | 100% | ✅ |
| PWA 설정 | 100% | ✅ |
| Capacitor 플러그인 | 100% | ✅ |
| Shared Packages | 100% | ✅ |
| Sentry 모니터링 | 100% | ✅ (테스트 페이지 포함) |
| **Phase 2: 고급 기능** | **90%** | 🔄 진행 중 |
| 로그인/인증 | 80% | 🔄 코드 완료 (외부 설정 대기) |
| 주문 추적 | 100% | ✅ 완료 (Supabase Realtime) |
| 사용자 기능 | 90% | ✅ 완료 (마이페이지/주소/찜) |
| 리뷰 & 공유 | 0% | 📋 계획 |
| 고객 지원 | 0% | 📋 계획 |
| **고도화** | **0%** | 📋 분석 완료 |
| 기반 정리 (Store ID, API, 결제) | 0% | 🔴 우선 |
| 핵심 추가 (취소, 검색, 알림) | 0% | 🟠 다음 |
| 고도화 (리뷰, 지도, 쿠폰) | 0% | 🟡 이후 |
| **Phase 3: Native App** | **30%** | 📋 계획 |
| 환경 구축 | 70% | 🔄 진행 중 |
| 네이티브 기능 | 0% | 📋 계획 |
| 스토어 배포 | 0% | 📋 계획 |

---

## 🎯 다음 단계 우선순위

### 1순위: 기반 정리 (고도화 전 필수)
1. **Store ID 동적 처리** — 하드코딩 제거
2. **useOrders 실제 API 연동** — Mock 제거
3. **결제 검증/멱등성** — 보안 강화
4. **API 패턴 통일** — fetch → api 클라이언트

### 2순위: 핵심 기능
1. **주문 취소/환불** (사용자 필수 기능)
2. **메뉴 검색** (UX 핵심)
3. **토스트 알림 & 에러 처리 개선**
4. **실시간 추적 활성화**

### 3순위: 외부 설정 필요
1. **카카오 로그인** (카카오 Developer 앱 등록)
2. **애플 로그인** (Apple Developer 계정, iOS 출시 시)
3. **FCM 푸시 알림** (Firebase 프로젝트)

### 스토어 배포 준비
1. **Google Play Console** 계정 ($25)
2. **Apple Developer** 계정 ($99/년)
3. **앱 아이콘 & 스크린샷** 준비
4. **개인정보처리방침** URL 준비

---

## 📚 관련 문서

- [DEPLOYMENT.md](./DEPLOYMENT.md) - Android/iOS 배포 가이드
- [FEATURES.md](./FEATURES.md) - 기능 목록 및 설명
- [README.md](./README.md) - 프로젝트 개요
- [AUTH_SETUP.md](./AUTH_SETUP.md) - 인증 설정 가이드 (packages/shared)
- [ENV_MANAGEMENT.md](../../packages/shared/ENV_MANAGEMENT.md) - 환경 변수 관리

---

## 💡 개발 팁

### PWA 테스트
```bash
# 로컬에서 PWA 테스트
pnpm dev
# → Chrome DevTools → Application → Manifest 확인
# → Service Workers 확인
# → "홈 화면에 추가" 테스트
```

### Capacitor 동기화
```bash
# 웹 변경사항을 네이티브로 동기화
pnpm cap:sync

# Android 실행
pnpm android

# iOS 실행 (Mac 필요)
pnpm ios
```

### 환경 변수 설정
```bash
# .env.local 생성
NEXT_PUBLIC_API_URL=http://localhost:4000
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_TOSS_CLIENT_KEY=your-toss-key
```

---

## 🔧 트러블슈팅

### PWA 설치 버튼이 안 나타날 때
- HTTPS 환경 확인 (localhost는 예외)
- manifest.json 문법 오류 확인
- Service Worker 등록 확인

### Capacitor 플러그인 오류
```bash
# 플러그인 재설치
pnpm cap:sync
cd ios/App && pod install  # iOS만
```

### 빌드 오류
```bash
# 캐시 삭제 후 재빌드
pnpm clean  # 있다면
rm -rf .next
pnpm build
```

---

**마지막 업데이트**: 2026-04-12  
**다음 목표**: 고도화 1순위 — Store ID 동적 처리, useOrders API 연동, 결제 보안 강화
