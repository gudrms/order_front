# 📋 Table Order System Project Checklist

## 1. 📅 기획 (Planning) - [완료]
- [x] 요구사항 정의 (Requirements)
- [x] 기술 스택 선정 (Tech Stack)
- [x] 데이터베이스 설계 (ERD)
- [x] 화면 설계 (Wireframes)
- [x] API 명세서 작성 (API Spec)

## 2. 🎨 디자인 (Design)
- [ ] 디자인 시스템 구축 (Color, Font, Component)
- [ ] UI 디자인 (Figma 등 활용)
- [ ] 아이콘 및 이미지 리소스 준비

## 3. 💻 개발 (Development)

### 3.1 Frontend - Customer Tablet (Next.js)
- [x] **기본 설정**
    - [x] Next.js 프로젝트 생성 및 Tailwind 설정
    - [x] 폰트 및 컬러 팔레트 적용
- [x] **메인 화면 (Menu Board)**
    - [x] 카테고리 사이드바 구현 (좌측 고정)
    - [x] 메뉴 리스트 그리드 구현
    - [x] 메뉴 상세 모달 (옵션/수량 선택)
    - [x] 카테고리별 스크롤 이동
- [x] **주문 기능**
    - [x] 장바구니 상태 관리 (Zustand)
    - [x] 장바구니 패널 UI (우측)
    - [x] 주문 전송 API 연동 (Mock)
    - [x] 주문 성공 모달 (2초 자동 닫힘, 카운트다운)
- [x] **유틸리티**
    - [x] 직원 호출 기능 (메뉴 방식으로 통합)
    - [x] 주문 내역 조회 패널 (우측)
    - [x] 주문 내역 총액 표시
- [ ] **추가 개선사항**
    - [ ] 이미지 업로드 및 표시
    - [ ] 품절 처리 UI
    - [ ] 로딩 상태 개선

### 3.2 Frontend - Admin Dashboard (Next.js)
- [ ] **주문 접수 (Kitchen/POS)**
    - [ ] 실시간 주문 알림 (Supabase Realtime)
    - [ ] 주문 상태 변경 (접수/조리/완료)
    - [ ] 알림 사운드 재생 기능
- [ ] **매장 관리**
    - [ ] 메뉴 등록/수정/삭제 (이미지 업로드)
    - [ ] 테이블 QR 코드 생성 및 관리
    - [ ] 매출 통계 차트 (Recharts)

### 3.3 Backend (NestJS)
- [x] **프로젝트 초기 설정**
    - [x] NestJS 프로젝트 생성 및 모노레포 구성
    - [x] 전역 필터(Exception), 인터셉터(Transform), 파이프(Validation) 설정
- [x] **주문 및 세션 비즈니스 로직**
    - [x] 테이블 세션(TableSession) 관리 로직 구현
    - [x] 주문(Order) 및 주문 상세(OrderItem) 저장 로직 구현
    - [x] **직원 호출**: 0원 메뉴 기반 주문 시스템 통합 ✅
- [x] **데이터베이스 및 시딩**
    - [x] Prisma 모델 설계 및 마이그레이션
    - [x] 테스트 데이터 시딩 (`seed.ts` - 토스 메뉴 29종 및 직원호출 포함)
- [ ] **Toss POS 연동 (진행 중)**
    - [x] 연동 아키텍처 확정: Frontend SDK(Insert) + Backend API(Select)
    - [x] `CreateOrderDto`에 `tossOrderId` 수신 필드 추가
    - [ ] 백엔드 메뉴 동기화 API (Toss API -> Local DB Sync) 구현 예정

## 4. 🧪 테스트 (Testing)
- [x] 단위 테스트 (Unit Test) - Vitest 기반 24개 항목 통과
- [x] **공통 라이브러리 검증**
    - [x] `@order/shared` 패키지 빌드 에러 및 인코딩 복구 완료
    - [x] `OrderStatus` 모든 상태에 대한 라벨 및 색상 정의 완료 (PAID, PREPARING, READY, DELIVERING 추가) ✅
- **문제**: 일정 시간 요청이 없으면 서버가 sleep 모드로 전환
- **영향**: 다음 첫 요청 시 3~5초 지연 발생 → 고객 경험 저하
- **현재 대응**: Keep-Alive 미구현 (LocalStorage 기반 Leader Election은 서로 다른 기기 간 조율 불가)
- **해결 방안**:
  - Railway/Render/Fly.io 등 항상 켜져있는 서버로 이전
  - 또는 Vercel Pro 플랜 ($20/월) + Cron Jobs로 주기적 ping

#### 2. **실행 시간 제한**
- **Hobby 플랜**: 10초
- **Pro 플랜**: 60초
- **문제**: 대용량 파일 처리, 복잡한 계산 등 긴 작업 시 타임아웃
- **대응**: OKPOS 전송 시 8초 timeout 설정 필요

#### 3. **WebSocket 미지원**
- **문제**: 실시간 양방향 통신 불가
- **영향**:
  - 주방 화면에서 실시간 주문 알림 구현 불가
  - 주문 상태 변경 시 고객 화면 실시간 업데이트 불가
- **대안**:
  - Polling 방식 (5초마다 API 호출) - 비효율적
  - 서버 이전 (Railway/Render 등)

#### 4. **Stateful 작업 불가**
- **문제**: 매 요청마다 새로운 인스턴스 생성
- **영향**:
  - In-memory 캐싱 불가
  - 세션 관리 어려움
  - Connection Pool 제한적
- **대응**: Supabase pgBouncer 사용 중

#### 5. **파일 시스템 제한**
- **쓰기 가능**: `/tmp` 디렉토리만 (최대 512MB)
- **문제**: 이미지 임시 저장, 파일 업로드/다운로드 제한적
- **대응**: Supabase Storage 직접 사용

#### 6. **Cron Jobs 제한**
- **Hobby 플랜**: 하루 1회만 실행 가능
- **Pro 플랜**: 무제한
- **현재**: Cron jobs 비활성화 (`vercel.json`에서 주석 처리)
- **필요 시**: `apps/backend/VERCEL_CRON.md` 참고

---

### 📊 **비용 비교**

| 항목 | Vercel Hobby | Vercel Pro | Railway | Render |
|------|-------------|-----------|---------|--------|
| 월 비용 | $0 | $20 | $5~ | $0~$7 |
| Cold Start | 있음 | 있음 | 없음 | 있음 (무료) |
| 실행 시간 | 10초 | 60초 | 무제한 | 무제한 |
| WebSocket | ❌ | ❌ | ✅ | ✅ |
| Cron Jobs | 1회/일 | 무제한 | ✅ | ✅ |
| Connection Pool | 제한적 | 제한적 | ✅ | ✅ |

---

### 🎯 **권장 사항**

#### **개발/테스트 단계 (현재)**
- ✅ Vercel Hobby로 충분
- ✅ Mock 데이터로 프론트엔드 개발
- ✅ Cold Start 감수 가능

#### **실제 서비스 단계**
- 🔴 **Railway 또는 Render로 이전 검토**
  - 특히 실시간 주방 화면이 필요한 경우 필수
  - 월 $5~$7 정도면 충분
  - 항상 켜져있는 서버 + WebSocket 지원

- 🟡 **또는 Vercel Pro + Polling**
  - 실시간성은 포기하고 5초 주기 polling
  - Cold Start 해결 위해 Cron Jobs 활용
  - 월 $20

---

### 🔧 **현재 미해결 사항**
---

### ✅ **완료 기준**

- ✅ **타입 안전성**: Frontend ↔ Backend 타입 100% 일치 (`@order/shared` 패키지)
- ✅ **테스트 커버리지**: 핵심 비즈니스 로직 테스트 작성 (24개 테스트 통과)
- ✅ **에러 핸들링**: ErrorBoundary + ErrorToast + Supabase 로깅 구축
- ✅ **컴포넌트 분리**: `CartItemCard`, `CartSummary` Container/Presenter 분리
- ✅ **MSW 통합**: 개발 환경 Mock API 자동화
- [ ] **OKPOS 연동**: 실패 시 자동 재시도 + 모니터링 대시보드 (보류 - API 스펙 미확정)

---

### 📌 **2025-12-31 완료 작업 요약**

#### ✅ **높은 우선순위 완료**
1. **모노레포 타입 공유 패키지** (`packages/shared`)
   - 공통 타입, 상수, 유틸리티 통합
   - UUID 타입 통일
   - 15개 파일 import 경로 변경

2. **테스트 프레임워크** (Vitest)
   - `cartStore` 13개 테스트
   - `CartItemCard` 11개 테스트
   - 총 24개 테스트 전체 통과

#### ✅ **중간 우선순위 완료**
3. **Container/Presenter 패턴**
   - `CartItemCard`, `CartSummary` 분리
   - 하위 호환성 유지

4. **전역 에러 처리 시스템**
   - ErrorBoundary, ErrorToast, ErrorStore
   - Supabase 에러 로깅
   - Winston Logger (Backend)

5. **MSW 도입**
   - Service Worker 기반 Mock API
   - 환경별 자동 활성화/비활성화
   - 구조화된 Mock 데이터

#### ✅ **사용자 작업 완료** (2025-12-31)
- ✅ Backend HttpExceptionFilter 구현
- ✅ Backend ValidationPipe 전역 등록
- ✅ Next.js App Router `error.tsx` 파일 추가
- ✅ Swagger 문서화 설정
- ✅ GitHub Actions CI/CD 파이프라인
- ✅ **보안 강화 완료**
  - ✅ Rate Limiting (DDoS 방지)
  - ✅ Helmet.js (보안 헤더)
  - ✅ CORS 정책 엄격화

---

**다음 액션 아이템** (선택사항):
1. Swagger DTO 데코레이터 추가 (`@ApiProperty()`, `@ApiTags()`)
2. CI/CD pnpm 캐싱 적용
3. 프로덕션 환경 변수 설정 (`FRONTEND_URL`)