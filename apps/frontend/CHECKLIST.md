# 🍽️ m-오더 개발 체크리스트

## ✅ Phase 1: 프로젝트 초기 설정 및 API 통신 구조 (완료)

### 프로젝트 초기 설정

- [x] Next.js 14 프로젝트 생성 (App Router)
- [x] TypeScript 설정
- [x] Tailwind CSS 설정
- [x] 프로젝트 폴더 구조 설계

### API 통신 구조

- [x] Axios 인스턴스 설정 (`lib/api/client.ts`)
- [x] API 엔드포인트 모듈화 (`lib/api/endpoints/`)
- [x] TanStack Query 설정 (`lib/query/client.ts`)
- [x] 환경 변수 설정 (`.env.local`)

### 타입 정의

- [x] Menu, MenuCategory, MenuOption 타입
- [x] Order, OrderItem 타입
- [x] API Response 공통 타입

---

## ✅ Phase 2: 고객용 태블릿 UI - 메뉴 페이지 (완료)

### 상태 관리 (Zustand)

- [x] cartStore - 장바구니 상태 관리
- [x] uiStore - UI 상태 관리 (패널, 사이드바)

### 레이아웃 컴포넌트

- [x] Sidebar - 좌측 카테고리 네비게이션
- [x] TopBar - 상단 카테고리 탭 (모바일)
- [x] BottomBar - 하단 주문내역/장바구니 버튼
- [x] DetailPanel - 우측 슬라이드 패널

### 메뉴 상세 컴포넌트

- [x] MenuDetailContent - 메뉴 상세 정보 + 옵션 선택
- [x] CallContent - 직원 호출 화면

### 스크롤 네비게이션

- [x] MenuGrid - 전체 메뉴 그리드
- [x] CategorySection - 카테고리별 섹션
- [x] MenuCard - 개별 메뉴 카드
- [x] useActiveSection - Intersection Observer 훅

### Mock 데이터

- [x] 5개 카테고리 (치킨, 피자, 파스타, 음료, 디저트)
- [x] 25개 메뉴 (각 카테고리당 5개)
- [x] 옵션 데이터 (사이즈, 토핑, 사이드)
- [x] Mock 모드 지원 (useMenus 훅)

### 기능

- [x] 카테고리 클릭 → 해당 섹션 스크롤
- [x] 스크롤 시 활성 카테고리 자동 하이라이트
- [x] 메뉴 클릭 → 상세 패널 열림
- [x] 옵션 선택 → 장바구니 담기
- [x] 품절 메뉴 표시

---

## ✅ Phase 3: 장바구니 & 주문 플로우 (진행 중)

### Step 1: 장바구니 페이지 (완료)

- [x] CartItemCard - 장바구니 아이템 카드
- [x] CartSummary - 총 금액 요약
- [x] 장바구니 페이지 (`/customer/cart`)
- [x] 수량 조절 (+/- 버튼)
- [x] 삭제 기능
- [x] 빈 장바구니 처리
- [x] 뒤로가기 기능

### Step 2: 주문 확인 모달 (대기)

- [ ] OrderConfirmModal 컴포넌트
- [ ] 주문 내역 최종 확인
- [ ] 테이블 번호 표시
- [ ] 주문 생성 API (Mock)

### Step 3: 주문 완료 페이지 (대기)

- [ ] 주문 완료 페이지 (`/customer/order/complete`)
- [ ] 주문번호 표시
- [ ] 처음으로/주문내역 버튼

---

## ⏳ Phase 4: 주문 내역 페이지 (대기)

### 주문 내역 조회

- [ ] OrderHistoryPage 컴포넌트
- [ ] 주문 목록 조회 API (Mock)
- [ ] 주문 상태별 필터링
- [ ] 주문 상세 보기

---

## ⏳ Phase 5: 관리자 페이지 (대기)

### 주문 관리

- [ ] 실시간 주문 수신
- [ ] 주문 상태 변경
- [ ] 주문 내역 조회

### 메뉴 관리

- [ ] 메뉴 CRUD
- [ ] 카테고리 관리
- [ ] 품절 처리

### 통계

- [ ] 일일 매출
- [ ] 인기 메뉴
- [ ] 시간대별 주문량

---

## 🎯 다음 작업

**우선순위 1**: Phase 3 - Step 2 (주문 확인 모달)
**우선순위 2**: Phase 3 - Step 3 (주문 완료 페이지)
**우선순위 3**: Phase 4 (주문 내역 페이지)

---

## 📊 진행률

```
Phase 1: ████████████████████ 100% (완료)
Phase 2: ████████████████████ 100% (완료)
Phase 3: ████████░░░░░░░░░░░░  33% (1/3 완료)
Phase 4: ░░░░░░░░░░░░░░░░░░░░   0% (대기)
Phase 5: ░░░░░░░░░░░░░░░░░░░░   0% (대기)

전체: ████████░░░░░░░░░░░░  40% (2/5 완료)
```
