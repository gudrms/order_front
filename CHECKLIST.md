# 📋 Frontend Development Checklist

> 테이블 오더 시스템 프론트엔드 개발 체크리스트

---

## 1. ⚙️ 프로젝트 설정 (Project Setup)

### 기본 설정
- [x] Next.js 16 프로젝트 초기화
- [x] TypeScript 설정
- [x] Tailwind CSS v4 설정
- [x] PWA 설정 (next-pwa)
- [x] manifest.json 생성
- [x] Service Worker 설정 (next.config.ts)
- [x] PWA 아이콘 준비 (192x192, 512x512, 180x180)
- [ ] ESLint 설정 (코드 품질)
- [ ] Prettier 설정 (코드 포맷팅)
- [ ] `.env.local` 환경 변수 파일 생성
- [ ] Git hooks 설정 (Husky + lint-staged)

### 폴더 구조
- [ ] `src/components/` - 공통 컴포넌트 폴더 생성
- [ ] `src/features/` - 기능별 모듈 폴더 생성
- [ ] `src/hooks/` - 커스텀 훅 폴더 생성
- [ ] `src/lib/` - 유틸리티 폴더 생성
- [ ] `src/stores/` - Zustand 스토어 폴더 생성
- [ ] `src/types/` - TypeScript 타입 정의 폴더 생성

### 패키지 설치
- [ ] Zustand (클라이언트 상태 관리)
- [ ] TanStack Query (서버 상태 관리)
- [ ] WebSocket 라이브러리 (STOMP.js)
- [ ] 아이콘 라이브러리 (lucide-react 또는 react-icons)
- [ ] 날짜 라이브러리 (date-fns 또는 dayjs)
- [ ] 차트 라이브러리 (recharts - 관리자용)

---

## 2. 🎨 디자인 시스템 (Design System)

### 색상 팔레트
- [ ] Primary 컬러 정의 (브랜드 메인 색상)
- [ ] Secondary 컬러 정의
- [ ] Success/Warning/Error 컬러 정의
- [ ] Gray Scale 정의 (배경, 텍스트)
- [ ] Tailwind CSS config에 커스텀 컬러 추가

### 타이포그래피
- [ ] 헤딩 폰트 설정 (H1~H6)
- [ ] 본문 폰트 설정
- [ ] 폰트 크기 시스템 정의 (text-sm, text-base, text-lg...)
- [ ] 폰트 굵기 정의 (font-normal, font-medium, font-bold)

### 공통 컴포넌트
- [ ] `Button` - 기본 버튼 (primary, secondary, outline)
- [ ] `Input` - 텍스트 입력 필드
- [ ] `Card` - 카드 컨테이너
- [ ] `Modal` - 모달 팝업
- [ ] `Drawer` - 사이드 슬라이드 (장바구니용)
- [ ] `Badge` - 뱃지 (수량 표시)
- [ ] `Spinner` - 로딩 인디케이터
- [ ] `Toast` - 알림 메시지

---

## 3. 🧑‍🤝‍🧑 고객용 태블릿 (Customer Tablet)

### 3.1 메인 화면 (Menu Board)
- [ ] **페이지 구조**
  - [ ] `/customer/menu` 라우트 생성
  - [ ] 레이아웃 구성 (Header + Sidebar + Grid + Bottom Bar)

- [ ] **카테고리 사이드바**
  - [ ] 카테고리 리스트 컴포넌트
  - [ ] 선택 상태 관리
  - [ ] 카테고리 필터링 기능
  - [ ] 검색 기능 (선택 사항)

- [ ] **메뉴 그리드**
  - [ ] 메뉴 카드 컴포넌트 (`MenuCard`)
  - [ ] 이미지 최적화 (Next.js Image)
  - [ ] 품절 표시 UI
  - [ ] 가격 포맷팅 (예: 15,500원)
  - [ ] 터치 친화적 크기 조정 (최소 44x44px)

- [ ] **메뉴 상세 모달**
  - [ ] 큰 이미지 표시
  - [ ] 메뉴 설명 렌더링
  - [ ] 옵션 선택 UI (체크박스, 라디오 버튼)
  - [ ] 수량 조절 버튼 (-, +)
  - [ ] 장바구니 담기 버튼

### 3.2 장바구니 기능
- [ ] **Zustand 스토어 구현**
  - [ ] `cartStore.ts` 생성
  - [ ] 상태: `items`, `totalPrice`, `totalQuantity`
  - [ ] 액션: `addItem`, `removeItem`, `updateQuantity`, `clearCart`

- [ ] **장바구니 UI**
  - [ ] 장바구니 드로어/모달 컴포넌트
  - [ ] 담긴 메뉴 리스트 표시
  - [ ] 각 항목별 수량 조절 (+, -)
  - [ ] 개별 항목 삭제 버튼
  - [ ] 총 금액 계산 및 표시

- [ ] **주문 전송**
  - [ ] 주문 확인 컨펌 모달
  - [ ] POST `/api/v1/orders` API 연동
  - [ ] 성공 시 장바구니 비우기
  - [ ] 실패 시 에러 처리 (Toast 메시지)

### 3.3 직원 호출
- [ ] 직원 호출 버튼 (물, 티슈, 수저, 기타)
- [ ] POST `/api/v1/calls` API 연동
- [ ] 호출 완료 피드백 (Toast)

### 3.4 주문 내역 조회
- [ ] `/customer/orders` 페이지 생성
- [ ] GET `/api/v1/orders/table/{tableId}` API 연동
- [ ] 주문 내역 리스트 표시
- [ ] 주문 상태별 구분 (접수됨, 조리중, 서빙완료)
- [ ] 총 주문 금액 표시

---

## 4. 👨‍🍳 관리자 대시보드 (Admin Dashboard)

### 4.1 주문 접수 현황판 (Order Dashboard)
- [ ] **페이지 구조**
  - [ ] `/admin/dashboard` 라우트 생성
  - [ ] 그리드 레이아웃 (주문 카드 나열)

- [ ] **주문 카드 컴포넌트**
  - [ ] 테이블 번호 표시
  - [ ] 경과 시간 표시 (5분 지남 → 색상 변경)
  - [ ] 주문 메뉴 리스트 및 옵션
  - [ ] 상태 변경 버튼 (조리 시작, 서빙 완료)

- [ ] **실시간 주문 알림**
  - [ ] WebSocket 연결 (`/topic/store/{storeId}/orders`)
  - [ ] 신규 주문 도착 시 알림음 재생
  - [ ] 화면 깜빡임 또는 강조 효과
  - [ ] 주문 리스트 자동 업데이트

- [ ] **주문 상태 관리**
  - [ ] PATCH `/api/v1/admin/orders/{orderId}/status` API 연동
  - [ ] 상태: PENDING → COOKING → SERVED
  - [ ] 낙관적 업데이트 (Optimistic Update)

### 4.2 테이블 현황
- [ ] `/admin/tables` 페이지 생성
- [ ] 테이블 배치도 그리드 렌더링
- [ ] 테이블 상태 (공석, 식사중, 정리 필요)
- [ ] 이용 시간 표시

### 4.3 메뉴 관리
- [ ] `/admin/menu` 페이지 생성
- [ ] 메뉴 리스트 테이블 (이미지, 이름, 가격, 카테고리)
- [ ] 품절 토글 스위치
- [ ] 메뉴 등록/수정 모달
- [ ] 이미지 업로드 기능 (Drag & Drop)
- [ ] CRUD API 연동

### 4.4 매출 통계
- [ ] `/admin/analytics` 페이지 생성
- [ ] 일/주/월별 매출 추이 차트 (Line Chart)
- [ ] 인기 메뉴 Top 5 (Bar Chart)
- [ ] 일자별 상세 매출 테이블
- [ ] 엑셀 다운로드 기능

---

## 5. 🔌 API 연동 (API Integration)

### 5.1 API 클라이언트 설정
- [ ] `lib/api/client.ts` 생성
- [ ] Base URL 환경 변수 설정
- [ ] 인터셉터 설정 (에러 핸들링)
- [ ] 타입 안전한 API 함수 작성

### 5.2 TanStack Query 설정
- [ ] `app/providers.tsx` QueryClientProvider 설정
- [ ] 기본 옵션 설정 (staleTime, cacheTime, retry)
- [ ] DevTools 추가 (개발 환경)

### 5.3 API 엔드포인트 구현
- [ ] **메뉴 관련**
  - [ ] `GET /api/v1/stores/{storeId}/categories` - 메뉴 조회
  - [ ] `GET /api/v1/menus/{menuId}` - 메뉴 상세

- [ ] **주문 관련**
  - [ ] `POST /api/v1/orders` - 주문 생성
  - [ ] `GET /api/v1/orders/table/{tableId}` - 주문 내역 조회
  - [ ] `POST /api/v1/orders/{orderId}/cancel` - 주문 취소

- [ ] **직원 호출**
  - [ ] `POST /api/v1/calls` - 직원 호출

- [ ] **관리자 API**
  - [ ] `GET /api/v1/admin/orders` - 주문 접수 목록
  - [ ] `PATCH /api/v1/admin/orders/{orderId}/status` - 주문 상태 변경
  - [ ] `PATCH /api/v1/admin/menus/{menuId}/soldout` - 품절 처리

### 5.4 WebSocket 연동
- [ ] STOMP.js 라이브러리 설치
- [ ] `useWebSocket.ts` 커스텀 훅 작성
- [ ] 연결 관리 (connect, disconnect)
- [ ] 구독 관리 (subscribe, unsubscribe)
- [ ] 메시지 핸들링

---

## 6. 🧪 테스트 (Testing)

### 단위 테스트
- [ ] 테스트 라이브러리 설치 (Jest, Testing Library)
- [ ] 공통 컴포넌트 테스트
- [ ] Zustand 스토어 테스트
- [ ] 유틸리티 함수 테스트

### 통합 테스트
- [ ] API 호출 테스트 (MSW 활용)
- [ ] 페이지 렌더링 테스트
- [ ] 사용자 플로우 테스트 (E2E)

### 반응형 테스트
- [ ] 태블릿 환경 테스트 (iPad, Galaxy Tab)
- [ ] 다양한 화면 크기 테스트
- [ ] 터치 인터랙션 테스트

---

## 7. 🚀 배포 (Deployment)

### 빌드 최적화
- [ ] 프로덕션 빌드 테스트 (`npm run build`)
- [ ] 번들 크기 분석 (`@next/bundle-analyzer`)
- [ ] 이미지 최적화 확인
- [ ] 불필요한 의존성 제거

### CI/CD 파이프라인
- [ ] GitHub Actions 워크플로우 작성
- [ ] 자동 빌드 및 테스트
- [ ] NCP Server 배포 스크립트

### 환경 변수
- [ ] 프로덕션 환경 변수 설정
- [ ] API URL 확인
- [ ] WebSocket URL 확인

### 도메인 & SSL
- [ ] 도메인 연결
- [ ] HTTPS 인증서 적용 (PWA 필수)
- [ ] CDN 설정

### PWA 배포
- [x] PWA 아이콘 모두 업로드 확인
- [x] manifest.json 접근 가능 확인
- [x] Service Worker 정상 작동 확인
- [x] 로컬 테스트 완료 (URL 바 제거 확인)
- [ ] Lighthouse PWA 점수 90+ 확인
- [ ] 실제 태블릿에서 "홈 화면 추가" 테스트
- [ ] HTTPS 환경에서 PWA 테스트

---

## 8. 📈 모니터링 & 최적화 (Monitoring & Optimization)

- [ ] 에러 트래킹 (Sentry 등)
- [ ] 성능 모니터링 (Lighthouse CI)
- [ ] 로그 수집 및 분석
- [ ] 사용자 피드백 수집 시스템
- [ ] PWA 업데이트 전략 수립

---

## 9. 📚 문서화 (Documentation)

- [x] README.md 작성
- [x] PWA 섹션 추가
- [x] 프론트엔드 체크리스트 작성
- [x] PWA 아이콘 가이드 작성
- [ ] 컴포넌트 스토리북 (선택 사항)
- [ ] API 클라이언트 문서
- [ ] 배포 가이드

---

## 10. 🎯 추가 기능 (Optional Features)

- [ ] 다크 모드 지원
- [ ] 다국어 지원 (i18n)
- [x] PWA 설정 (오프라인 대응) ✅
- [ ] 접근성 개선 (ARIA, 키보드 네비게이션)
- [ ] 애니메이션 효과 (Framer Motion)

---

## 진행 상황 요약

```
✅ 완료: 11개
🚧 진행 중: 0개
⏳ 예정: 85+ 개
```

**완료 항목:**
- ✅ Next.js 16 프로젝트 초기화
- ✅ TypeScript 설정
- ✅ Tailwind CSS v4 설정
- ✅ PWA 설정 (next-pwa)
- ✅ manifest.json 생성
- ✅ Service Worker 설정
- ✅ PWA 아이콘 생성 및 업로드
- ✅ PWA 로컬 테스트 완료
- ✅ README.md 작성
- ✅ PWA 섹션 추가
- ✅ 프론트엔드 체크리스트 작성

---

> **Last Updated**: 2024-12-26  
> **Status**: PWA 설정 완료, 로컬 테스트 완료 ✅

---

## 다음 단계 (Next Steps)

1. **실제 태블릿 테스트** - Android/iOS 태블릿에서 PWA 설치 및 동작 확인
2. **패키지 설치** - Zustand, TanStack Query 등 필요한 라이브러리 설치
3. **폴더 구조 구성** - 컴포넌트 및 기능별 폴더 생성
4. **디자인 시스템 구축** - 컬러, 폰트, 공통 컴포넌트 작성
5. **고객용 메뉴 화면** - 메뉴 그리드 및 카테고리 사이드바 개발

---

**참고**: 이 체크리스트는 프론트엔드 개발에 집중되어 있습니다.  
백엔드 및 전체 프로젝트 체크리스트는 `참고사항/CHECKLIST.md`를 참조하세요.
