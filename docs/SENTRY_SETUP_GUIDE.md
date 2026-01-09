# Sentry 설정 가이드

## 📋 개요

이 프로젝트는 Sentry를 사용하여 Frontend(Next.js)와 Backend(NestJS)의 에러를 실시간으로 모니터링합니다.

## 🎯 설정 완료 항목

### ✅ 패키지 설치 완료
- `@sentry/nextjs` (Frontend Apps)
- `@sentry/nestjs`, `@sentry/profiling-node` (Backend)

### ✅ 설정 파일 생성 완료
- **Frontend Apps** (table-order, admin, delivery-customer, brand-website)
  - `sentry.client.config.ts`
  - `sentry.server.config.ts`
  - `sentry.edge.config.ts`
  - `next.config.ts` (Sentry 플러그인 적용)

- **Backend**
  - `src/main.ts` (Sentry 초기화)
  - `src/common/logger/sentry.transport.ts` (Winston Transport)
  - `src/common/logger/winston.logger.ts` (Sentry Transport 추가)

### ✅ 기존 시스템 통합 완료
- **Frontend**: ErrorStore에 Sentry 통합
- **Backend**: Winston Logger에 Sentry Transport 추가

---

## 🚀 시작하기

### 1단계: Sentry 프로젝트 생성

1. Sentry 대시보드 접속: https://sentry.io
2. Organization: `jhg-qn`에서 다음 프로젝트들의 **DSN 키** 복사:
   - `table-order`
   - `admin`
   - `delivery-customer`
   - `brand-website`
   - `backend`

### 2단계: 환경변수 설정

각 앱의 `.env.local` 파일에 Sentry DSN을 추가하세요.

#### Frontend Apps (table-order, admin, delivery-customer, brand-website)

\`\`\`bash
# apps/table-order/.env.local
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN_KEY@o0.ingest.sentry.io/PROJECT_ID
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN
SENTRY_ORG=jhg-qn
SENTRY_PROJECT=table-order
\`\`\`

다른 앱들도 동일한 형식으로 설정하되, `SENTRY_PROJECT` 값만 변경:
- `admin` → `SENTRY_PROJECT=admin`
- `delivery-customer` → `SENTRY_PROJECT=delivery-customer`
- `brand-website` → `SENTRY_PROJECT=brand-website`

#### Backend

\`\`\`bash
# apps/backend/.env
SENTRY_DSN=https://YOUR_DSN_KEY@o0.ingest.sentry.io/PROJECT_ID
SENTRY_ENVIRONMENT=development  # 또는 production
\`\`\`

### 3단계: Vercel 환경변수 설정 (프로덕션 배포)

각 앱의 Vercel 프로젝트 설정에서 다음 환경변수를 추가하세요:

**Frontend Apps**
- `NEXT_PUBLIC_SENTRY_DSN`
- `SENTRY_AUTH_TOKEN`
- `SENTRY_ORG=jhg-qn`
- `SENTRY_PROJECT` (앱별로 다름)

**Backend**
- `SENTRY_DSN`
- `SENTRY_ENVIRONMENT=production`

---

## 🧪 테스트

### Frontend 테스트

각 앱에서 의도적으로 에러를 발생시켜 Sentry에 전송되는지 확인:

\`\`\`typescript
// 컴포넌트 내에서 테스트
import { useErrorStore } from '@/stores/errorStore';

const { addError } = useErrorStore();

addError({
  code: 'TEST_ERROR',
  message: 'Sentry 테스트 에러입니다',
  severity: 'error',
  meta: {
    testData: 'This is a test',
  },
});
\`\`\`

### Backend 테스트

LoggerService를 사용하여 테스트:

\`\`\`typescript
import { LoggerService } from '@/common/logger/logger.service';

// 컨트롤러나 서비스에서
this.logger.error('Sentry 테스트 에러', 'TestContext');
\`\`\`

### 확인 방법

1. Sentry 대시보드 접속
2. 해당 프로젝트로 이동
3. Issues 탭에서 방금 발생시킨 에러 확인
4. Source Maps가 올바르게 적용되었는지 확인 (원본 코드 라인 표시)

---

## 📊 에러 모니터링 흐름

### Frontend (Next.js)
\`\`\`
사용자 액션
  ↓
에러 발생
  ↓
ErrorStore.addError()
  ↓
├─ Sentry.captureException() (실시간 알림)
├─ Backend API (/api/v1/error-logs) (Critical만, 백업용)
└─ UI 토스트 표시
\`\`\`

### Backend (NestJS)
\`\`\`
API 요청
  ↓
에러 발생
  ↓
LoggerService.error()
  ↓
Winston Logger
  ↓
├─ Console Transport (모든 로그)
├─ Sentry Transport (ERROR 이상, 실시간 알림)
└─ Supabase Transport (ERROR 이상, 백업/감사)
\`\`\`

---

## ⚙️ 주요 설정

### 성능 모니터링 샘플링

무료 플랜의 이벤트 제한(월 5,000건)을 고려하여 샘플링 비율 설정:

- **Production**: 10% (`tracesSampleRate: 0.1`)
- **Development**: 100% (`tracesSampleRate: 1.0`)

### PII (개인식별정보) 필터링

민감정보 자동 제거:
- 쿠키
- Authorization 헤더
- 비밀번호 필드

### Source Maps

- 빌드 시 자동으로 Sentry에 업로드
- 프로덕션 빌드에는 포함되지 않음 (`hideSourceMaps: true`)

---

## 🔔 알림 설정

Sentry 대시보드에서 알림 규칙 설정:

1. **Settings** → **Alerts** → **Create Alert Rule**
2. 권장 알림 규칙:
   - **CRITICAL 에러 발생 시** → 즉시 Slack/Email 알림
   - **새로운 에러 발견 시** → 일일 다이제스트
   - **에러 급증 시** (10분에 100건 이상) → 즉시 알림

---

## 📈 무료 플랜 최적화

Sentry 무료 플랜: **월 5,000 이벤트**

### 이벤트 절약 팁

1. **샘플링 비율 조정**
   - Production: 10% 샘플링 (`tracesSampleRate: 0.1`)
   - 필요시 5%로 낮추기

2. **불필요한 에러 필터링**
   - NetworkError 무시 (이미 적용됨)
   - 404 에러 무시 고려

3. **개발 환경 분리**
   - 개발 환경용 별도 Sentry 프로젝트 사용 권장
   - 프로덕션 쿼터 보호

---

## 🆘 문제 해결

### 에러가 Sentry에 전송되지 않아요

1. **환경변수 확인**
   - `NEXT_PUBLIC_SENTRY_DSN` 또는 `SENTRY_DSN`이 올바르게 설정되었는지 확인
   - `.env.local` 파일 재시작

2. **네트워크 확인**
   - 브라우저 개발자 도구 → Network 탭
   - `sentry.io`로의 요청이 성공하는지 확인

3. **DSN 키 확인**
   - Sentry 대시보드 → 프로젝트 설정 → Client Keys (DSN)
   - 올바른 DSN인지 재확인

### Source Maps가 작동하지 않아요

1. **Auth Token 확인**
   - Vercel 환경변수에 `SENTRY_AUTH_TOKEN` 설정 확인
   - Sentry 대시보드 → Settings → Auth Tokens에서 재발급

2. **빌드 로그 확인**
   - Vercel 빌드 로그에서 "Sentry webpack plugin" 메시지 확인
   - 에러 메시지가 있다면 Auth Token 재설정

---

## 🔗 참고 링크

- [Sentry Next.js 문서](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry NestJS 문서](https://docs.sentry.io/platforms/node/guides/nestjs/)
- [Sentry 베스트 프랙티스](https://docs.sentry.io/product/best-practices/)
- [Sentry 가격 정책](https://sentry.io/pricing/)

---

## 📝 다음 단계

1. Sentry 대시보드에서 알림 규칙 설정
2. 팀원들을 Sentry Organization에 초대
3. 1주일간 에러 발생 빈도 모니터링
4. 샘플링 비율 최적화
5. 불필요한 에러 필터링 추가

---

## 💡 베스트 프랙티스

1. **에러 컨텍스트 추가**
   \`\`\`typescript
   Sentry.captureException(error, {
     tags: { feature: 'checkout' },
     extra: { orderId: '123', userId: 'abc' },
   });
   \`\`\`

2. **사용자 정보 설정** (로그인 후)
   \`\`\`typescript
   Sentry.setUser({
     id: user.id,
     email: user.email,
   });
   \`\`\`

3. **Breadcrumbs 활용**
   \`\`\`typescript
   Sentry.addBreadcrumb({
     category: 'auth',
     message: 'User logged in',
     level: 'info',
   });
   \`\`\`

4. **Performance Monitoring**
   - 느린 API 엔드포인트 식별
   - 페이지 로드 시간 추적
   - 데이터베이스 쿼리 성능 모니터링
