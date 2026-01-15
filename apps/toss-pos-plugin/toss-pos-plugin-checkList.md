# Toss POS Plugin 개발 체크리스트

## ✅ 1. 개발 환경 준비 (Toss Place)
- [ ] **개발자 계정 생성**
    - [ ] [Toss Place 개발자 센터](https://place.toss.im/developer) 가입
    - [ ] '내 애플리케이션' 생성 및 `App Key` 발급
- [ ] **테스트 매장 연동**
    - [ ] 개발용 테스트 매장 생성
    - [ ] POS 기기(또는 시뮬레이터)에 테스트 매장 로그인

## 🔌 2. 프로젝트 설정
- [ ] **기본 설정**
    - [ ] `manifest.json` (또는 `plugin.json`) 설정 파일 생성 (앱 이름, 권한 등)
    - [ ] `package.json` 의존성 확인
- [ ] **SDK 설치**
    - [ ] pnpm 패키지 설치: `pnpm add @tossplace/pos-plugin-sdk`
    - [ ] 또는 스크립트 로드 방식 확인

## 💻 3. 핵심 기능 구현
### 3-1. 백엔드 통신 (주문 수신)
- [x] **주문 수신 로직 (Hybrid)**
    - [x] **Primary**: Supabase Realtime (`INSERT` 이벤트 구독)
    - [x] **Fallback**: Polling (30초 간격, `GET /api/v1/pos/orders/pending`)
- [x] **주문 상태 동기화**
    - [x] 주문 접수/완료/취소 시 백엔드로 상태 전송 (`PATCH /api/v1/pos/orders/:id/status`)

### 3-2. 프론트엔드 연동 (`apps/table-order`)
- [x] **매장 ID 전송 수정**
    - [x] `StoreContext` 도입하여 URL 기반 매장 UUID 조회
    - [x] 주문 생성 API 호출 시 하드코딩된 ID 대신 실제 UUID 전송

### 3-2. POS 연동 (SDK 활용)
- [ ] **주문 등록 (`posPluginSdk.order.add`)**
    - [ ] 수신된 주문 데이터를 `PluginOrderDto` 포맷으로 변환
    - [ ] SDK 함수 호출: `await posPluginSdk.order.add(orderDto)`
- [ ] **추가 주문 (`posPluginSdk.order.addMenu`)**
    - [ ] 기존 주문에 메뉴 추가 시 사용
    - [ ] SDK 함수 호출: `await posPluginSdk.order.addMenu(orderId, orderDto)`
- [ ] **주문 완료 (`posPluginSdk.order.complete`)**
    - [ ] 주문 처리 완료 시 호출 (후불 POS 전용)
    - [ ] SDK 함수 호출: `await posPluginSdk.order.complete(orderId)`
- [ ] **주문 조회 (`posPluginSdk.order.getOrders`)**
    - [ ] 필요 시 주문 목록 조회 및 상태 동기화
- [ ] **주문 취소 (`posPluginSdk.order.cancel`)**
    - [ ] 백엔드 취소 요청 시 POS 주문도 취소 처리
- [ ] **이벤트 리스너 (`posPluginSdk.order.on`)**
    - [ ] `cancel` 이벤트 등 POS에서 발생하는 상태 변경 감지

## 📦 4. 빌드 및 배포
- [ ] **빌드 스크립트**
    - [ ] 소스 코드 번들링 (Webpack/Vite)
    - [ ] `dist` 폴더를 `plugin.zip`으로 압축하는 스크립트 작성
- [ ] **업로드 및 테스트**
    - [ ] 개발자 센터에 `plugin.zip` 업로드
    - [ ] '테스트 배포' 후 POS 기기에서 다운로드 및 실행 확인
