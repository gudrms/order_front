# Admin App 구현 계획

## 📋 프로젝트 개요

관리자용 대시보드 애플리케이션 구현
- **기술 스택**: Next.js 16 (App Router), TypeScript, Tailwind CSS
- **인증**: Supabase Auth
- **배포**: Vercel (독립 프로젝트)
- **API**: 공통 Backend API 사용

---

## 🏗️ 아키텍처

### 디렉토리 구조
```
apps/admin/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── (auth)/            # 인증 관련 페이지
│   │   │   ├── login/         # 로그인 페이지
│   │   │   └── register/      # 회원가입 페이지
│   │   ├── (dashboard)/       # 대시보드 (인증 필요)
│   │   │   ├── layout.tsx     # 공통 레이아웃
│   │   │   ├── page.tsx       # 홈 대시보드
│   │   │   ├── orders/        # 주문 관리
│   │   │   ├── menu/          # 메뉴 관리
│   │   │   ├── store/         # 매장 관리
│   │   │   └── settings/      # 설정
│   │   └── layout.tsx         # 루트 레이아웃
│   ├── components/            # 공통 컴포넌트
│   │   ├── ui/               # 기본 UI 컴포넌트
│   │   ├── auth/             # 인증 관련 컴포넌트
│   │   └── dashboard/        # 대시보드 컴포넌트
│   ├── lib/                   # 유틸리티
│   │   ├── supabase.ts       # Supabase 클라이언트
│   │   └── api.ts            # API 클라이언트
│   ├── hooks/                 # Custom Hooks
│   │   ├── useAuth.ts        # 인증 훅
│   │   └── useUser.ts        # 사용자 정보 훅
│   └── contexts/              # Context Providers
│       └── AuthContext.tsx   # 인증 컨텍스트
├── public/                    # 정적 파일
├── package.json
├── tsconfig.json
├── tailwind.config.ts
├── next.config.js
└── .env.local
```

---

## 🔐 인증 플로우

### 1. 회원가입
```
사용자 입력 (이메일/비밀번호)
    ↓
Supabase Auth 회원가입 (supabase.auth.signUp)
    ↓
Backend API 호출 (POST /api/v1/auth/register)
    ↓
Prisma DB에 사용자 정보 저장
    ↓
자동 로그인 → 대시보드 이동
```

### 2. 로그인
```
사용자 입력 (이메일/비밀번호)
    ↓
Supabase Auth 로그인 (supabase.auth.signInWithPassword)
    ↓
JWT 토큰 받기 (session.access_token)
    ↓
토큰을 로컬 스토리지/쿠키에 저장
    ↓
대시보드 이동
```

### 3. 보호된 라우트 접근
```
페이지 접근
    ↓
미들웨어/레이아웃에서 세션 확인
    ↓
세션 없음 → /login으로 리다이렉트
세션 있음 → 페이지 렌더링
    ↓
API 요청 시 Authorization 헤더에 토큰 포함
    ↓
Backend에서 SupabaseGuard로 토큰 검증
```

---

## 🎨 주요 기능

### Phase 1: 인증 시스템 (우선순위: 높음)
- [ ] Supabase 클라이언트 설정
- [ ] AuthContext 구현
- [ ] 로그인 페이지
- [ ] 회원가입 페이지
- [ ] 로그아웃 기능
- [ ] 보호된 라우트 미들웨어

### Phase 2: 대시보드 레이아웃 (우선순위: 높음)
- [ ] 공통 레이아웃 (사이드바, 헤더)
- [ ] 네비게이션 메뉴
- [ ] 사용자 프로필 메뉴
- [ ] 반응형 디자인

### Phase 3: 주문 관리 (우선순위: 중간)
- [ ] 실시간 주문 목록
- [ ] 주문 상태 변경
- [ ] 주문 상세 보기
- [ ] 주문 히스토리

### Phase 4: 메뉴 관리 (우선순위: 중간)
- [ ] **Toss POS 메뉴 동기화** (Source of Truth: Toss)
- [ ] 메뉴 꾸미기 (사진, 태그, 설명 추가)
- [ ] 카테고리 관리 (Toss 카테고리 매핑)
- [ ] 품절 처리 (Toss 연동 + 강제 품절)

### Phase 5: 매장 관리 (우선순위: 낮음)
- [ ] 매장 정보 설정
- [ ] 영업 시간 설정
- [ ] 테이블 관리

### Phase 6: 통계 대시보드 (우선순위: 낮음)
- [ ] 매출 통계
- [ ] 인기 메뉴
- [ ] 실시간 차트

---

## 🛠️ 기술 스택 상세

### Frontend
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **State Management**: Zustand (필요시)
- **Data Fetching**: TanStack Query
- **Form**: React Hook Form (필요시)
- **Icons**: Lucide React

### Authentication
- **Provider**: Supabase Auth
- **Session**: Cookie-based (persistSession: true)
- **Token**: JWT (Bearer Token)

### API Communication
- **Base URL**: `NEXT_PUBLIC_API_URL`
- **Auth Header**: `Authorization: Bearer <token>`
- **Interceptor**: Axios로 토큰 자동 삽입

---

## 🚀 배포 전략

### Vercel 설정
1. 새 프로젝트 생성: `order-admin`
2. Root Directory: `apps/admin`
3. Build Command: `cd ../.. && turbo build --filter=admin`
4. Output Directory: `.next`

### 환경변수
```env
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx
```

### 도메인
- 개발: `localhost:3002`
- 프로덕션: `admin.yourdomain.com`

---

## 📦 의존성

### 주요 패키지
```json
{
  "dependencies": {
    "next": "16.1.1",
    "react": "19.2.3",
    "react-dom": "19.2.3",
    "@supabase/supabase-js": "^2.89.0",
    "@tanstack/react-query": "^5.90.12",
    "axios": "^1.13.2",
    "zustand": "^5.0.9",
    "lucide-react": "^0.562.0",
    "clsx": "^2.1.1",
    "tailwind-merge": "^3.4.0"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^19",
    "@types/react-dom": "^19",
    "typescript": "^5",
    "tailwindcss": "^4",
    "@tailwindcss/postcss": "^4",
    "eslint": "^9",
    "eslint-config-next": "16.1.1"
  }
}
```

---

## 🔒 보안 고려사항

### 1. 토큰 관리
- ✅ HttpOnly Cookie 사용 (XSS 방지)
- ✅ Secure 플래그 설정 (HTTPS only)
- ✅ SameSite=Strict (CSRF 방지)

### 2. 라우트 보호
- ✅ Middleware에서 세션 확인
- ✅ 미인증 사용자 자동 리다이렉트
- ✅ Role-based access control (향후)

### 3. API 통신
- ✅ HTTPS only
- ✅ CORS 설정 확인
- ✅ Rate limiting (Backend)

---

## 📊 진행 상황 추적

### 체크리스트
자세한 체크리스트는 `CHECKLIST.md` 참고

### 마일스톤
- **M1**: 프로젝트 초기 설정 (2일)
- **M2**: 인증 시스템 구현 (3일)
- **M3**: 대시보드 레이아웃 (2일)
- **M4**: 주문 관리 기능 (5일)
- **M5**: 메뉴 관리 기능 (5일)
- **M6**: 배포 및 테스트 (2일)

**예상 총 기간**: 3주

---

## 🤝 참고 자료

- [Next.js App Router 문서](https://nextjs.org/docs/app)
- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [TanStack Query 문서](https://tanstack.com/query/latest)
- [Tailwind CSS 문서](https://tailwindcss.com/docs)
