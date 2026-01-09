# Sentry 빠른 시작 가이드 🚀

## ✅ 이미 완료된 작업

1. **패키지 설치 완료**
   - Frontend: `@sentry/nextjs` (모든 앱)
   - Backend: `@sentry/nestjs`, `@sentry/profiling-node`

2. **설정 파일 생성 완료**
   - 모든 Frontend 앱에 Sentry config 파일 생성
   - Backend에 Sentry 초기화 코드 추가

3. **기존 시스템 통합 완료**
   - Frontend ErrorStore에 Sentry 연동
   - Backend Winston Logger에 Sentry Transport 추가

---

## 🎯 당신이 해야 할 일

### 1️⃣ Sentry 프로젝트 생성 (5분 소요)

1. Sentry 대시보드: https://sentry.io
2. Organization: `jhg-qn`
3. 다음 5개 프로젝트 생성:
   - **table-order** (Platform: Next.js)
   - **admin** (Platform: Next.js)
   - **delivery-customer** (Platform: Next.js)
   - **brand-website** (Platform: Next.js)
   - **backend** (Platform: Node.js)

4. 각 프로젝트에서 **DSN 키** 복사 (Settings → Client Keys)

---

### 2️⃣ 로컬 환경변수 설정 (3분 소요)

각 앱의 `.env.local` 파일 생성 (.env.example 참고):

#### Frontend Apps

\`\`\`bash
# apps/table-order/.env.local
NEXT_PUBLIC_SENTRY_DSN=https://YOUR_DSN_KEY@o0.ingest.sentry.io/PROJECT_ID
SENTRY_AUTH_TOKEN=YOUR_AUTH_TOKEN  # Sentry Settings → Auth Tokens에서 생성
SENTRY_ORG=jhg-qn
SENTRY_PROJECT=table-order
\`\`\`

다른 앱들도 동일하게 설정 (SENTRY_PROJECT만 변경):
- `apps/admin/.env.local` → `SENTRY_PROJECT=admin`
- `apps/delivery-customer/.env.local` → `SENTRY_PROJECT=delivery-customer`
- `apps/brand-website/.env.local` → `SENTRY_PROJECT=brand-website`

#### Backend

\`\`\`bash
# apps/backend/.env
SENTRY_DSN=https://YOUR_DSN_KEY@o0.ingest.sentry.io/PROJECT_ID
SENTRY_ENVIRONMENT=development
\`\`\`

---

### 3️⃣ 테스트 (2분 소요)

#### Frontend 테스트

\`\`\`bash
cd apps/table-order
pnpm dev
\`\`\`

브라우저 콘솔에서:

\`\`\`javascript
// ErrorStore를 사용하여 테스트 에러 발생
const { addError } = useErrorStore.getState();
addError({
  code: 'TEST_ERROR',
  message: 'Sentry 테스트 에러입니다',
  severity: 'error',
});
\`\`\`

#### Backend 테스트

\`\`\`bash
cd apps/backend
pnpm dev
\`\`\`

아무 컨트롤러에서 일부러 에러 발생시키기:

\`\`\`typescript
throw new Error('Sentry 테스트 에러');
\`\`\`

#### 확인

Sentry 대시보드 → Issues에서 에러 확인!

---

### 4️⃣ Vercel 배포 설정 (프로덕션용)

각 Vercel 프로젝트의 **Settings → Environment Variables**에 추가:

**Frontend Apps (모두 동일)**
- `NEXT_PUBLIC_SENTRY_DSN`: (각 프로젝트의 DSN)
- `SENTRY_AUTH_TOKEN`: (Sentry Auth Token)
- `SENTRY_ORG`: `jhg-qn`
- `SENTRY_PROJECT`: (각 앱 이름)

**Backend**
- `SENTRY_DSN`: (Backend 프로젝트 DSN)
- `SENTRY_ENVIRONMENT`: `production`

---

## 📊 이제 무엇을 할 수 있나요?

### 실시간 에러 모니터링
- 모든 Frontend/Backend 에러를 Sentry 대시보드에서 실시간 확인
- Source Maps로 원본 코드 라인 확인
- 사용자 환경 정보, 에러 발생 경로 추적

### 성능 모니터링
- 느린 페이지 로드 감지
- 느린 API 엔드포인트 식별
- 데이터베이스 쿼리 성능 추적

### 알림 설정
- Slack/Discord/Email로 즉시 알림
- 중요한 에러만 선별하여 알림
- 에러 급증 시 자동 알림

---

## 📚 더 알아보기

- **상세 가이드**: [SENTRY_SETUP_GUIDE.md](./SENTRY_SETUP_GUIDE.md)
- **구현 계획**: [SENTRY_IMPLEMENTATION_PLAN.md](./SENTRY_IMPLEMENTATION_PLAN.md)
- **Sentry 공식 문서**: https://docs.sentry.io

---

## 💡 팁

1. **무료 플랜 최적화**
   - 월 5,000 이벤트 제한
   - 개발 환경은 별도 프로젝트 사용 권장
   - 샘플링 비율 조정 (현재 10%)

2. **알림 설정**
   - CRITICAL 에러만 즉시 알림
   - 나머지는 일일 다이제스트
   - 알림 피로 방지

3. **성능 모니터링**
   - 1주일간 데이터 수집
   - 느린 페이지/API 식별
   - 최적화 우선순위 결정

---

## 🆘 문제가 있나요?

1. `.env.local` 파일이 제대로 로드되는지 확인
2. DSN 키가 올바른지 확인
3. 브라우저 개발자 도구 → Network에서 `sentry.io` 요청 확인
4. 더 많은 문제 해결: [SENTRY_SETUP_GUIDE.md](./SENTRY_SETUP_GUIDE.md#문제-해결)

---

**축하합니다! 🎉 이제 프로덕션급 에러 모니터링 시스템을 갖추셨습니다!**
