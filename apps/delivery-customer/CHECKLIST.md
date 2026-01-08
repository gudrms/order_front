# 배달 앱 (Delivery Customer) 개발 체크리스트

## ✅ Phase 1: 핵심 기능 구현 (완료)

### 1. 홈 화면
- [x] HomeHeader (헤더)
- [x] Dashboard (포인트/쿠폰 현황)
- [x] ServiceButtons (주문 방식 선택: 배달/포장/매장)
- [x] QuickMenu (원클릭 주문, 선물하기)
- [x] BottomNav (네비게이션)

### 2. 메뉴 & 주문
- [x] 메뉴 페이지 (/menu)
- [x] CategoryTabs (카테고리 탭, Sticky)
- [x] MenuList (메뉴 리스트 + 필터링)
- [x] MenuDetailBottomSheet (옵션 선택)
- [x] CartBottomSheet (장바구니)
- [x] 수량 조절 및 삭제
- [x] 최소 주문 금액 확인 (15,000원)

### 3. 배달 주소
- [x] AddressInputBottomSheet (배달 정보 입력)
- [x] Daum 우편번호 서비스 연동 (packages/shared)
- [x] 주문자 정보 입력 (이름, 전화번호)
- [x] 배달 요청사항 입력

### 4. 결제
- [x] 토스페이먼츠 SDK 설치
- [x] 결제 페이지 (/order/checkout)
- [x] 결제 방법 선택 (카드/만나서결제)
- [x] 토스페이먼츠 연동 (packages/shared)
- [x] 주문 생성 API (packages/shared)
- [x] 결제 성공 페이지 (/order/success)
- [x] 결제 실패 페이지 (/order/fail)
- [x] 주문 완료 페이지 (/order/complete)

### 5. 주문 내역
- [x] 주문 내역 페이지 (/orders)
- [x] 주문 상태별 아이콘/색상
- [x] 빈 상태 처리
- [x] useOrders Hook (React Query)

### 6. PWA 설정
- [x] manifest.json 생성
- [x] Service Worker (sw.js)
- [x] PWAInstaller 컴포넌트 (앱 설치 배너)
- [x] Layout 메타데이터 설정

### 7. Capacitor 네이티브
- [x] Camera
- [x] Geolocation
- [x] Push Notifications
- [x] Status Bar
- [x] Haptics
- [x] Local Notifications
- [x] Network
- [x] Share
- [x] Toast
- [x] Browser
- [x] App

### 8. Shared Packages
- [x] API Client (GET, POST, PATCH, PUT, DELETE)
- [x] Cart Store (Zustand)
- [x] Menu Selection Hook
- [x] Daum Postcode (주소 검색)
- [x] Toss Payments (결제)
- [x] Supabase Client (인증)
- [x] Types 체계 정리
  - [x] CreateTableOrderRequest (테이블 주문용)
  - [x] CreateDeliveryOrderRequest (배달/결제용)
  - [x] PaymentOrderItemInput / PaymentOrderResponse
  - [x] 레거시 호환 alias 추가
- [x] Validation & Format Utils
- [x] ENV_MANAGEMENT.md (환경 변수 관리)

---

## 🔄 Phase 2: 인증 & 고급 기능

### 1. 로그인/인증
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

### 2. 주문 추적 (선택)
- [ ] 실시간 주문 상태 업데이트 (Supabase Realtime)
- [ ] 배달 진행 상황 UI
- [ ] 주문 상세 페이지 (/orders/[id])

### 3. 사용자 기능
- [ ] 마이페이지 (/mypage)
- [ ] 배달 주소 목록 관리
- [ ] 즐겨찾기 주소
- [ ] 최근 주문 내역
- [ ] 쿠폰/포인트 관리

### 4. 기타
- [ ] 리뷰 작성 (카메라 연동)
- [ ] 공유하기 기능
- [ ] 고객센터/FAQ
- [ ] 배달비 계산 로직 (거리 기반)

---

## 📊 진행률

| 카테고리 | 진행률 | 상태 |
|---------|--------|------|
| **Phase 1** | **98%** | ✅ 완료 |
| 홈 화면 | 100% | ✅ |
| 메뉴 & 주문 | 100% | ✅ |
| 배달 주소 | 100% | ✅ |
| 결제 | 100% | ✅ |
| 주문 내역 | 90% | ⚠️ (API 연동만 남음) |
| PWA | 100% | ✅ |
| Capacitor | 100% | ✅ |
| Shared | 100% | ✅ |
| **Phase 2** | **70%** | 🔄 진행 중 |
| 로그인/인증 | 80% | ✅ 코드 완료 (외부 설정 대기) |

---

## 🔐 로그인 구현 전략

### 앱에서의 로그인 특징
- **계속 로그인 유지**: Refresh Token 사용
- **자동 로그인**: 앱 실행 시 토큰 확인
- **로컬 저장**: AsyncStorage (React Native) 또는 LocalStorage (웹)

### Supabase Auth 추천 방식

#### 1️⃣ 휴대폰 번호 인증 (OTP)
```typescript
// 1. 휴대폰 번호로 OTP 전송
await supabase.auth.signInWithOtp({
  phone: '+821012345678',
})

// 2. 사용자가 입력한 OTP 코드로 인증
await supabase.auth.verifyOtp({
  phone: '+821012345678',
  token: '123456', // 사용자가 받은 6자리 코드
  type: 'sms'
})
```

#### 2️⃣ 자동 로그인 (Refresh Token)
```typescript
// Supabase가 자동으로 Refresh Token 관리
// LocalStorage에 자동 저장됨
const { data: { session } } = await supabase.auth.getSession()

if (session) {
  // 로그인된 상태
  console.log('User:', session.user)
}
```

#### 3️⃣ 로그인 상태 유지
```typescript
// 앱 시작 시
useEffect(() => {
  // Supabase가 자동으로 세션 복구
  supabase.auth.getSession().then(({ data: { session } }) => {
    setUser(session?.user ?? null)
  })

  // 세션 변경 감지
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    (_event, session) => {
      setUser(session?.user ?? null)
    }
  )

  return () => subscription.unsubscribe()
}, [])
```

### 구현 순서

1. **Supabase 프로젝트 생성**
   - https://supabase.com
   - Phone Auth 활성화 (Settings > Authentication)

2. **환경 변수 설정**
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your-project-url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   ```

3. **AuthProvider 생성**
   - 전역 로그인 상태 관리
   - 자동 세션 복구

4. **로그인 UI**
   - 휴대폰 번호 입력
   - OTP 코드 입력
   - 자동 로그인 처리

5. **보호된 라우트**
   - 주문 전 로그인 확인
   - 마이페이지 접근 제어

---

## 🎯 다음 단계 제안

**Option A: 로그인 먼저 구현** (추천)
- 사용자 식별 가능
- 주문 내역 연동 가능
- 개인화된 서비스 제공

**Option B: 로그인 없이 진행**
- 게스트 주문 허용
- 전화번호만으로 주문 조회
- 추후 로그인 추가

어떤 방식으로 진행할까요?
