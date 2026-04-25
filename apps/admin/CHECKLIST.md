# Admin App 체크리스트

마지막 업데이트: 2026-04-25

## 현재 판단

- 목적: 점주/운영자가 메뉴, 주문, 테이블, 배달 설정, 결제 상태를 관리하는 백오피스.
- 현재 상태: 기본 관리자 UI와 주문/메뉴/테이블 관리 골격은 있음.
- 가장 큰 남은 일: 새 공통 주문 코어(`Order`, `Payment`, `OrderDelivery`)를 관리자 화면에 반영하는 것.

## 완료

### 프로젝트/인증

- [x] `apps/admin` Next.js 앱 구성
- [x] Supabase client 설정
- [x] `AuthContext`/`useAuth` 구성
- [x] 로그인 페이지 구성
- [x] 초대 코드 기반 점주 연결 흐름 초안 구성
- [x] 초기 설정 페이지(`/setup`) 구성
- [x] 대시보드 레이아웃과 사이드바 구성

### 메뉴 관리

- [x] 메뉴 목록 페이지(`/menu`) 구성
- [x] 메뉴 신규 등록 페이지(`/menu/new`) 구성
- [x] 공통 `Menu` 타입/가격 포맷 적용
- [x] 백엔드 Toss 메뉴 동기화 API 존재: `POST /stores/:storeId/integrations/toss/sync-menu`

### 주문 관리

- [x] 주문 목록 페이지(`/orders`) 구성
- [x] 주문 상태 변경 API 호출 구조 존재
- [x] Supabase Realtime 주문 알림 hook 초안 존재
- [x] 주문 영수증 컴포넌트 `OrderReceipt.tsx` 존재
- [x] 공통 주문 상태 라벨/색상에 `PENDING_PAYMENT` 반영 완료

### 매장/테이블

- [x] 테이블/QR 관리 페이지(`/store/tables`) 구성
- [x] QR 코드 생성/인쇄 구조 존재
- [x] 매장 owner 연결 구조 존재

## 이번 큰그림 반영 완료

- [x] 백엔드 DB에 멀티앱 주문 채널 `OrderChannel` 추가
- [x] 백엔드 DB에 결제 모델 `Payment` 추가
- [x] 백엔드 DB에 배달 상세 모델 `OrderDelivery` 추가
- [x] 백엔드 DB에 `PaymentStatus`, `DeliveryStatus` 추가
- [x] `User.role` 기본값을 `USER`로 변경해서 고객 회원 생성 위험 완화
- [x] `okpos*` 잔재를 `toss*` 명명으로 수렴하도록 정리

## 남은 일

### P0: 새 주문 코어 관리자 반영

- [ ] 주문 목록에서 `type` 표시: `TABLE`, `DELIVERY`, `PICKUP`
- [ ] 주문 목록에서 `source` 표시: `TABLE_ORDER`, `DELIVERY_APP`, `HOMEPAGE`, `ADMIN`, `TOSS_SDK`, `POS`
- [ ] 주문 목록에서 `paymentStatus` 표시
- [ ] 배달 주문이면 `OrderDelivery` 주소/수령자/전화/요청사항 표시
- [ ] 관리자 주문 상세 모달 추가
- [ ] 주문 상세에서 메뉴 옵션 원본 ID와 스냅샷 이름/가격 모두 표시
- [ ] `PENDING_PAYMENT` 주문은 조리 시작 불가하도록 UI/백엔드 정책 추가

### P1: 결제/취소/환불 운영

- [ ] 결제 상세 패널 추가: provider, method, paymentKey, amount, approvedAt
- [ ] Toss 결제 승인/검증 결과 표시
- [ ] 현장 결제 주문과 온라인 결제 주문 구분
- [ ] 주문 취소 시 `cancelReason` 입력
- [ ] 환불/부분환불 상태 표시
- [ ] 중복 결제/중복 주문 방지용 idempotency key 표시

### P1: 배달 운영 설정

- [ ] 매장 설정에서 배달 가능 여부 `isDeliveryEnabled` 관리
- [ ] 최소 주문 금액 `minimumOrderAmount` 관리
- [ ] 배달비 `deliveryFee` 관리
- [ ] 무료 배달 기준 `freeDeliveryThreshold` 관리
- [ ] 예상 배달 시간 `estimatedDeliveryMinutes` 관리
- [ ] 배달 반경 `deliveryRadiusMeters` 관리

### P1: 메뉴/Toss 관리

- [ ] 관리자 화면에 Toss 메뉴 동기화 버튼 연결
- [ ] 메뉴 동기화 결과/오류 로그 표시
- [ ] Toss catalog code(`tossMenuCode`, `tossCategoryCode`, `tossOptionCode`) 표시
- [ ] 메뉴 품절/숨김 상태를 관리자에서 수정
- [ ] 메뉴 태그/이미지/설명 보강 UI 추가

### P2: 테이블오더 운영

- [ ] 테이블별 활성 세션 표시
- [ ] 테이블 주문 영수증 인쇄 버튼 연결
- [ ] 테이블 QR 재발급/비활성화 정책 추가
- [ ] 직원 호출 관리 화면 추가

## 다음 개발 순서

1. 주문 목록/상세를 새 `Order + Payment + OrderDelivery` 응답에 맞게 확장
2. 배달 설정 화면 추가
3. Toss 메뉴 동기화 버튼 연결
4. 결제/취소/환불 운영 패널 추가
5. 테이블 세션/직원 호출 관리 보강

## 검증 필요

- [ ] 관리자 앱 타입체크
- [ ] 관리자 앱 빌드
- [ ] 새 migration 적용 후 주문 목록 조회
- [ ] 배달 주문 상세 표시 E2E
- [ ] 테이블 주문 상태 변경 E2E
