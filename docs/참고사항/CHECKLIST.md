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
    - [x] NestJS 프로젝트 생성 (모노레포 apps/backend)
    - [x] Prisma 설정 및 스키마 정의 (387줄)
    - [x] Supabase 연동 (@supabase/supabase-js)
- [x] **API 구현 (Controller, Service)**
    - [x] 매장 관리 API (stores module)
    - [x] 메뉴/카테고리 관리 API (menus module)
    - [x] 주문 처리 API (orders module)
    - [x] 인증 모듈 (auth module with Supabase)
- [ ] **외부 연동**
    - [x] POS 시스템 연동 준비 (pos module)
    - [ ] OKPOS API 실제 연동 (axios-retry, Circuit Breaker)
    - [ ] Supabase Storage 연동 (이미지 업로드)
- [ ] **스케줄러**
    - [ ] 메뉴 동기화 (매일 새벽 3시)
    - [ ] 실패한 OKPOS 주문 재시도 (5분마다)
- [ ] **문서화**
    - [ ] Swagger 설정 (@nestjs/swagger)
- [ ] **테스트 및 배포**
    - [ ] 로컬 개발 환경 테스트
    - [ ] Vercel Serverless 배포 테스트

## 4. 🧪 테스트 (Testing)
- [ ] 단위 테스트 (Unit Test)
- [ ] 통합 테스트 (Integration Test)
- [ ] 사용자 인수 테스트 (UAT) - 태블릿/모바일 환경 테스트

## 5. 🚀 배포 (Deployment)
- [ ] **Vercel 배포**
    - [ ] Frontend 배포 (Edge Network)
    - [ ] Backend 배포 (Serverless Functions)
    - [ ] 환경 변수 설정
- [ ] **Supabase 설정**
    - [ ] PostgreSQL Database 생성
    - [ ] Realtime 채널 설정
    - [ ] Storage 버킷 생성
- [ ] **도메인 및 SSL**
    - [ ] 도메인 연결 (자동 HTTPS)
    - [ ] 환경별 URL 설정 (dev/staging/prod)

## 6. 📈 운영 및 유지보수 (Operation)
- [ ] **모니터링**
    - [ ] Vercel Analytics 설정
    - [ ] Supabase 로그 확인
    - [ ] OKPOS 연동 상태 모니터링
- [ ] **사용자 피드백**
    - [ ] 피드백 수집 채널 구축
    - [ ] 분석 및 개선사항 도출
- [ ] **유지보수**
    - [ ] 버그 수정
    - [ ] 기능 고도화
    - [ ] 성능 최적화

---

## 🚨 **Vercel Serverless 배포 시 주의사항 및 제한사항**

### ⚠️ **현재 방식의 문제점**

#### 1. **Cold Start (콜드 스타트)**
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

- [ ] **주방 화면 실시간 알림** (WebSocket 필요 → 서버 이전 or Polling)
- [ ] **OKPOS 실제 연동** (재시도 로직, 실패 주문 관리)
- [ ] **보안 강화** (테이블별 JWT 토큰, Rate Limiting)
- [ ] **에러 추적 시스템** (Sentry 연동)
- [ ] **성능 최적화** (이미지 최적화, 코드 스플리팅)
- [ ] **테스트 자동화** (Vitest, Playwright)

---

**추가 정보**: `/d/work/order_change/참고사항/checklist.md` 참고