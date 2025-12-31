# Admin App 개발 체크리스트

## 📦 Phase 1: 프로젝트 초기 설정

### 1.1 프로젝트 구조
- [ ] `apps/admin` 디렉토리 생성
- [ ] `package.json` 작성
- [ ] `tsconfig.json` 설정
- [ ] `next.config.js` 작성
- [ ] `.env.local` 환경변수 설정
- [ ] `.env.example` 작성
- [ ] `.gitignore` 작성

### 1.2 기본 설정
- [ ] Tailwind CSS 설정
- [ ] ESLint 설정
- [ ] 기본 디렉토리 구조 생성
  - [ ] `src/app`
  - [ ] `src/components`
  - [ ] `src/lib`
  - [ ] `src/hooks`
  - [ ] `src/contexts`
  - [ ] `public`

### 1.3 의존성 설치
- [ ] Next.js 및 React 설치
- [ ] TypeScript 설치
- [ ] Tailwind CSS 설치
- [ ] Supabase 클라이언트 설치
- [ ] TanStack Query 설치
- [ ] Axios 설치
- [ ] Lucide Icons 설치
- [ ] 기타 유틸리티 설치

### 1.4 개발 서버 테스트
- [ ] `pnpm dev` 실행 확인
- [ ] Turborepo 통합 확인
- [ ] Hot reload 동작 확인

---

## 🔐 Phase 2: 인증 시스템

### 2.1 Supabase 설정
- [ ] `lib/supabase.ts` 클라이언트 생성
  - [ ] `persistSession: true` 설정
  - [ ] 환경변수 연결
- [ ] TypeScript 타입 정의

### 2.2 AuthContext 구현
- [ ] `contexts/AuthContext.tsx` 생성
- [ ] `AuthProvider` 컴포넌트 구현
- [ ] 상태 관리
  - [ ] `user` (현재 사용자)
  - [ ] `session` (세션 정보)
  - [ ] `loading` (로딩 상태)
- [ ] 인증 함수 구현
  - [ ] `signIn(email, password)`
  - [ ] `signUp(email, password, name?)`
  - [ ] `signOut()`
  - [ ] `resetPassword(email)`
- [ ] 세션 복원 로직
  - [ ] 페이지 로드 시 세션 확인
  - [ ] 토큰 자동 갱신

### 2.3 Custom Hooks
- [ ] `hooks/useAuth.ts`
  - [ ] AuthContext 사용
  - [ ] 타입 안전성 보장
- [ ] `hooks/useUser.ts`
  - [ ] 현재 사용자 정보 반환
  - [ ] Backend API와 연동

### 2.4 로그인 페이지
- [ ] `app/(auth)/login/page.tsx` 생성
- [ ] 로그인 폼 UI
  - [ ] 이메일 입력
  - [ ] 비밀번호 입력
  - [ ] 로그인 버튼
  - [ ] "회원가입" 링크
  - [ ] "비밀번호 찾기" 링크 (선택)
- [ ] 폼 검증
  - [ ] 이메일 형식 검증
  - [ ] 필수 입력 확인
- [ ] 로그인 처리
  - [ ] Supabase Auth 호출
  - [ ] 에러 처리
  - [ ] 성공 시 대시보드로 리다이렉트
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 표시

### 2.5 회원가입 페이지
- [ ] `app/(auth)/register/page.tsx` 생성
- [ ] 회원가입 폼 UI
  - [ ] 이름 입력
  - [ ] 이메일 입력
  - [ ] 비밀번호 입력
  - [ ] 비밀번호 확인 입력
  - [ ] 회원가입 버튼
  - [ ] "로그인" 링크
- [ ] 폼 검증
  - [ ] 이메일 형식 검증
  - [ ] 비밀번호 강도 검증
  - [ ] 비밀번호 일치 확인
- [ ] 회원가입 처리
  - [ ] Supabase Auth 회원가입
  - [ ] Backend API 사용자 등록 (POST /auth/register)
  - [ ] 에러 처리
  - [ ] 성공 시 자동 로그인 및 리다이렉트
- [ ] 로딩 상태 표시
- [ ] 에러 메시지 표시

### 2.6 라우트 보호
- [ ] `middleware.ts` 작성
  - [ ] 세션 확인
  - [ ] 미인증 시 /login으로 리다이렉트
  - [ ] Public 라우트 예외 처리
- [ ] 또는 레이아웃에서 보호
  - [ ] `app/(dashboard)/layout.tsx`에서 세션 확인

### 2.7 로그아웃
- [ ] 헤더에 로그아웃 버튼
- [ ] 로그아웃 처리
  - [ ] Supabase 세션 종료
  - [ ] 로컬 상태 초기화
  - [ ] /login으로 리다이렉트

---

## 🎨 Phase 3: 대시보드 레이아웃

### 3.1 루트 레이아웃
- [ ] `app/layout.tsx` 생성
- [ ] HTML 기본 구조
- [ ] 메타데이터 설정
- [ ] 폰트 설정
- [ ] AuthProvider 래핑
- [ ] TanStack Query Provider 추가

### 3.2 대시보드 레이아웃
- [ ] `app/(dashboard)/layout.tsx` 생성
- [ ] 2-column 레이아웃 (사이드바 + 메인)
- [ ] 사이드바 컴포넌트
  - [ ] 로고
  - [ ] 네비게이션 메뉴
  - [ ] 접기/펼치기 기능
- [ ] 헤더 컴포넌트
  - [ ] 페이지 제목
  - [ ] 사용자 프로필 메뉴
  - [ ] 알림 아이콘 (선택)
- [ ] 반응형 디자인
  - [ ] 모바일: 햄버거 메뉴
  - [ ] 태블릿/데스크톱: 고정 사이드바

### 3.3 네비게이션 메뉴
- [ ] `components/dashboard/Sidebar.tsx`
- [ ] 메뉴 아이템
  - [ ] 대시보드 (홈)
  - [ ] 주문 관리
  - [ ] 메뉴 관리
  - [ ] 매장 설정
  - [ ] 내 정보
- [ ] 활성 메뉴 하이라이트
- [ ] 아이콘 추가

### 3.4 사용자 프로필 메뉴
- [ ] `components/dashboard/UserMenu.tsx`
- [ ] 드롭다운 메뉴
  - [ ] 사용자 이름/이메일 표시
  - [ ] 내 정보 링크
  - [ ] 설정 링크
  - [ ] 로그아웃 버튼

### 3.5 공통 UI 컴포넌트
- [ ] `components/ui/Button.tsx`
- [ ] `components/ui/Input.tsx`
- [ ] `components/ui/Card.tsx`
- [ ] `components/ui/Badge.tsx`
- [ ] `components/ui/Modal.tsx`
- [ ] `components/ui/Dropdown.tsx`

### 3.6 대시보드 홈
- [ ] `app/(dashboard)/page.tsx`
- [ ] 환영 메시지
- [ ] 통계 카드 (선택)
  - [ ] 오늘의 주문 수
  - [ ] 오늘의 매출
  - [ ] 대기 중인 주문
- [ ] 최근 주문 목록 (선택)

---

## 📝 Phase 4: 주문 관리

### 4.1 주문 목록
- [ ] `app/(dashboard)/orders/page.tsx`
- [ ] 주문 목록 API 연동
  - [ ] GET /api/v1/orders
  - [ ] TanStack Query 사용
- [ ] 주문 카드/테이블 UI
  - [ ] 주문 번호
  - [ ] 테이블 번호
  - [ ] 주문 시간
  - [ ] 상태 (대기/준비중/완료)
  - [ ] 총 금액
- [ ] 필터링
  - [ ] 상태별 필터
  - [ ] 날짜 필터
- [ ] 정렬
  - [ ] 최신순
  - [ ] 금액순

### 4.2 주문 상세
- [ ] `app/(dashboard)/orders/[id]/page.tsx`
- [ ] 주문 상세 API 연동
  - [ ] GET /api/v1/orders/:id
- [ ] 주문 정보 표시
  - [ ] 주문 번호
  - [ ] 테이블 정보
  - [ ] 주문 시간
  - [ ] 상태
- [ ] 주문 아이템 목록
  - [ ] 메뉴 이름
  - [ ] 수량
  - [ ] 가격
  - [ ] 옵션
- [ ] 주문 상태 변경
  - [ ] PATCH /api/v1/orders/:id
  - [ ] 버튼 UI (접수/준비중/완료)

### 4.3 실시간 주문 알림
- [ ] Supabase Realtime 구독
- [ ] 새 주문 알림
- [ ] 주문 목록 자동 업데이트
- [ ] 소리/진동 알림 (선택)

---

## 🍽️ Phase 5: 메뉴 관리

### 5.1 메뉴 목록
- [ ] `app/(dashboard)/menu/page.tsx`
- [ ] 메뉴 목록 API 연동
  - [ ] GET /api/v1/menu
- [ ] 메뉴 그리드/리스트 UI
  - [ ] 이미지
  - [ ] 이름
  - [ ] 가격
  - [ ] 카테고리
  - [ ] 품절 여부
- [ ] "새 메뉴 추가" 버튼
- [ ] 편집/삭제 버튼

### 5.2 메뉴 추가/수정
- [ ] `app/(dashboard)/menu/new/page.tsx`
- [ ] `app/(dashboard)/menu/[id]/edit/page.tsx`
- [ ] 메뉴 폼 UI
  - [ ] 이름 입력
  - [ ] 설명 입력
  - [ ] 가격 입력
  - [ ] 카테고리 선택
  - [ ] 이미지 업로드
  - [ ] 옵션 추가 (선택)
- [ ] 폼 검증
- [ ] API 연동
  - [ ] POST /api/v1/menu (생성)
  - [ ] PATCH /api/v1/menu/:id (수정)
- [ ] 이미지 업로드
  - [ ] Supabase Storage 사용
  - [ ] 이미지 미리보기

### 5.3 메뉴 삭제
- [ ] 삭제 확인 모달
- [ ] API 연동
  - [ ] DELETE /api/v1/menu/:id

### 5.4 품절 처리
- [ ] 토글 버튼
- [ ] API 연동
  - [ ] PATCH /api/v1/menu/:id

---

## 🏪 Phase 6: 매장 관리

### 6.1 매장 정보 설정
- [ ] `app/(dashboard)/store/page.tsx`
- [ ] 매장 정보 폼
  - [ ] 매장 이름
  - [ ] 주소
  - [ ] 전화번호
  - [ ] 설명
- [ ] API 연동
  - [ ] GET /api/v1/store
  - [ ] PATCH /api/v1/store

### 6.2 영업 시간 설정
- [ ] 요일별 영업 시간 입력
- [ ] 휴무일 설정

### 6.3 테이블 관리
- [ ] 테이블 목록
- [ ] 테이블 추가/삭제
- [ ] QR 코드 생성 (선택)

---

## 📊 Phase 7: 통계 대시보드 (선택)

### 7.1 매출 통계
- [ ] 일별/주별/월별 매출
- [ ] 차트 라이브러리 (Recharts)
- [ ] API 연동

### 7.2 인기 메뉴
- [ ] 판매량 기준 순위
- [ ] 차트 표시

### 7.3 실시간 현황
- [ ] 현재 주문 수
- [ ] 오늘 매출
- [ ] 테이블 현황

---

## 🚀 Phase 8: 배포 및 최적화

### 8.1 Vercel 배포
- [ ] Vercel 프로젝트 생성
- [ ] Root Directory 설정: `apps/admin`
- [ ] Build Command 설정
- [ ] 환경변수 설정
- [ ] 도메인 연결

### 8.2 최적화
- [ ] 이미지 최적화 (next/image)
- [ ] 코드 스플리팅 확인
- [ ] 번들 크기 분석
- [ ] Lighthouse 점수 확인

### 8.3 테스트
- [ ] 기능 테스트
  - [ ] 로그인/로그아웃
  - [ ] 주문 관리
  - [ ] 메뉴 관리
- [ ] 브라우저 호환성 테스트
- [ ] 모바일 반응형 테스트
- [ ] 성능 테스트

### 8.4 문서화
- [ ] README.md 작성
- [ ] 환경변수 가이드
- [ ] 배포 가이드
- [ ] 사용자 매뉴얼

---

## 🐛 Phase 9: 버그 수정 및 개선

### 9.1 발견된 버그
- [ ] (버그 발견 시 여기에 추가)

### 9.2 개선 사항
- [ ] (개선 아이디어 발견 시 여기에 추가)

---

## 📝 메모

### 개발 중 고려사항
- TypeScript strict mode 사용
- 에러 바운더리 추가
- 로딩 상태 일관성 있게 처리
- 에러 메시지 사용자 친화적으로
- 접근성(a11y) 고려

### 향후 추가 기능
- 다국어 지원 (i18n)
- 다크 모드
- 푸시 알림
- 엑셀 다운로드
- 영수증 인쇄
- 직원 관리 (Role-based)

---

## ✅ 진행 상황

**시작일**: 2025-12-31
**예상 완료일**: 2025-01-21

**현재 Phase**: 1 - 프로젝트 초기 설정
**완료율**: 0%

---

**마지막 업데이트**: 2025-12-31
