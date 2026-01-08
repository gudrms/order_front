# Admin App 개발 체크리스트

## 📦 Phase 1: 프로젝트 초기 설정
- [x] `apps/admin` 디렉토리 생성 및 구조 설정
- [x] `package.json`, `tsconfig.json`, `next.config.ts` 설정 완료
- [x] 환경변수(`.env.local`) 및 `.gitignore` 설정
- [x] Tailwind CSS 4 및 기본 디렉토리 구조 생성
- [x] 주요 의존성 설치 (Next.js, Supabase, TanStack Query, Axios, Lucide, qrcode.react, react-to-print)
- [x] 개발 서버 실행 및 빌드 테스트 완료

## 🔐 Phase 2: 인증 및 온보딩 시스템 (보안 강화)
- [x] Supabase 클라이언트 (`lib/supabase.ts`) 설정 (`persistSession: true`)
- [x] `AuthContext` 및 `useAuth` 훅 구현 (프로필 상태 감지 로직 포함)
- [x] 로그인 페이지 (`/login`) 구현 (이메일/비밀번호 인증)
- [x] **초대 전용(Invite Only) 정책 적용**: 회원가입 페이지 제거 및 외부 가입 차단
- [x] **프로필 초기 설정 페이지 (`/setup`) 구현**: 이름, 전화번호 입력 폼
- [x] **초대 코드(Invite Code) 시스템 구현**: 가입 시 매장 자동 연결 및 코드 일회용 처리 ⭐️
- [x] 라우트 보호 (미인증/미설정 사용자 `/setup` 강제 리다이렉트)

## 🎨 Phase 3: 대시보드 레이아웃
- [x] 루트 레이아웃 및 `AuthProvider` 래핑
- [x] 대시보드 레이아웃 (`app/(dashboard)/layout.tsx`) 구현
- [x] 사이드바 컴포넌트 (`Sidebar.tsx`) 및 반응형 네비게이션
- [x] 대시보드 홈 화면 (`/`) 요약 카드 UI (오늘 주문, 매출 등)

## 🍽️ Phase 4: 메뉴 관리 (POS 연동 보조)
- [x] 메뉴 목록 페이지 (`/menu`) API 연동 및 UI 구현
- [x] 공통 타입(`Menu`) 및 유틸리티(`formatCurrency`) 적용
- [x] 새 메뉴 등록 페이지 (`/menu/new`) 구현
- [x] **Supabase Storage 이미지 업로드** 기능 구현 (assets 버킷) ⭐️
- [ ] 메뉴 수정 페이지 (`/menu/[id]/edit`) 구현
- [ ] 메뉴 삭제 및 품절 처리(Toggle) 기능 연동
- [ ] 메뉴 동기화 버튼 (향후 POS 데이터 연동 대비)

## 📝 Phase 5: 주문 관리 (비상용/모니터링)
- [x] 주문 목록 페이지 (`/orders`) UI 구현
- [x] 공통 UI(`Badge`) 및 상수(`ORDER_STATUS_LABEL`, `ORDER_STATUS_COLOR`) 모든 상태 업데이트 완료 ✅
- [x] 주문 상태 변경(접수/조리/완료/준비중 등) API 연동
- [x] **Supabase Realtime 실시간 주문 알림** 연동 (`useRealtimeOrders`) 🔔
- [x] 실시간 알림 시 목록 자동 갱신 및 알림음 재생 폴더 구조 준비
- [ ] 주문 상세 보기 모달 (선택 옵션 상세 확인용)

## 📱 Phase 6: 기기 및 매장 설정 (핵심 차별화)
- [x] **테이블 관리 및 QR 코드 생성 페이지** (`/store/tables`) 구현
- [x] 테이블 추가/삭제에 따른 실시간 QR 코드(URL 포함) 렌더링
- [x] **QR 코드 인쇄 기능** (`react-to-print` 활용 A4 최적화) 🖨️
- [ ] 태블릿 대기 화면(스크린세이버) 이미지 설정 및 Storage 연동
- [ ] 매장 로고 및 앱 테마 컬러 설정 (JSON 설정값 저장)
- [ ] 배달앱 운영 설정 (배달팁, 최소 주문 금액)

---

## 🗑️ 제외된 기능 (POS 위임)
- ~~복잡한 매출 통계 대시보드~~ (POS 전용 앱 권장)
- ~~정교한 재고/수불 관리~~ (POS 데이터와 충돌 방지)

---

## ✅ 진행 상황 요약
**현재 단계**: Phase 6 (기기 및 매장 설정) 및 세부 기능 폴리싱
**완료율**: 약 75% (핵심 서비스 시나리오 모두 구현 완료)

---
**마지막 업데이트**: 2026-01-08.
