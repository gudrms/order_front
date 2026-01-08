# 배달 앱 (Delivery Customer) 개발 계획 및 체크리스트

## 🚀 개발 전략: PWA First, App Later
1.  **Phase 1: PWA (Progressive Web App)**
    - 브라우저를 통해 즉시 서비스 가능.
    - "홈 화면에 추가"를 통해 앱과 유사한 UX 제공.
    - Capacitor 플러그인 중 웹 지원이 가능한 기능 우선 구현.
2.  **Phase 2: Native App (Capacitor)**
    - PWA 안정화 후 Android/iOS 빌드.
    - 푸시 알림(FCM), 깊은 연동(Deep Linking) 등 네이티브 전용 기능 고도화.

---

## 1. Phase 1: PWA 구현 (현재 우선순위)

### A. PWA 기본 설정
- [ ] **Manifest & Icons**
    - [ ] `public/manifest.json` 설정 (이름, 아이콘, 테마 컬러, display: standalone).
    - [ ] 다양한 크기의 아이콘 생성 및 `public/icons` 배치.
    - [ ] Apple Touch Icon 설정.
- [ ] **Service Worker (next-pwa)**
    - [ ] `next.config.ts`에 `next-pwa` 설정 적용.
    - [ ] 오프라인 캐싱 전략 수립 (런타임 캐싱).
- [ ] **Install Prompt**
    - [ ] "앱 설치하여 주문하기" 유도 배너/팝업 구현.

### B. 핵심 서비스 기능 (Web 기반)
- [ ] **위치 서비스 (Geolocation)**
    - [ ] 브라우저 Geolocation API를 사용하여 현재 위치 가져오기.
    - [ ] 카카오/구글 주소 API 연동하여 상세 주소 입력.
- [ ] **메뉴 및 주문 로직**
    - [ ] 매장 목록 및 메뉴 조회 API 연동.
    - [ ] 장바구니 시스템 (Zustand + LocalStorage로 유지).
    - [ ] 주문서 작성 및 결제(포트원/토스페이먼츠 웹 SDK) 연동.
- [ ] **실시간 주문 추적**
    - [ ] Supabase Realtime을 이용한 실시간 상태 업데이트 (웹 소켓).

### C. UX/UI 최적화
- [ ] **Mobile-First 디자인**
    - [ ] 모든 화면이 모바일 브라우저에서 최적의 비율로 보이도록 조정.
    - [ ] 하단 탭 바 (Home, Search, Orders, My) 네비게이션 구현.
- [ ] **사용자 경험 고도화**
    - [ ] 스켈레톤 UI를 통한 로딩 체감 개선.
    - [ ] 터치 인터랙션 (스와이프 등) 최적화.

---

## 2. Phase 2: Native App 고도화 (향후 진행)

### A. Capacitor 환경 구축
- [ ] `capacitor.config.ts` 최종 확인.
- [ ] `npx cap sync`를 통한 웹 자산 동기화.
- [ ] Android Studio / Xcode 프로젝트 생성 및 설정.

### B. 네이티브 기능 연동
- [ ] **푸시 알림 (Push Notifications)**: FCM 설정 및 네이티브 알림 권한 처리.
- [ ] **바이오 인증**: Face ID / 지문 인식 로그인 추가.
- [ ] **딥링크 (Deep Linking)**: 외부 공유 링크 클릭 시 앱 자동 실행.
- [ ] **카메라**: 리뷰 작성 시 네이티브 카메라 인터페이스 연동.

### C. 스토어 배포 준비
- [ ] 스플래시 스크린 디자인 및 생성.
- [ ] Android 빌드 (AAB/APK) 및 Google Play Console 업로드.
- [ ] iOS 빌드 및 App Store Connect 업로드.

---

## 3. 공통 체크리스트 (PWA & App 공용)
- [ ] **멤버십/이벤트**: 쿠폰, 포인트 적립 시스템.
- [ ] **공유하기**: Web Share API (PWA) 및 Capacitor Share (App).
- [ ] **로그인/인증**: Supabase Auth 연동 (소셜 로그인 포함).