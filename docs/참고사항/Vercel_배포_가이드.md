# 🚀 Vercel 배포 가이드

## 📋 현재 배포 상태

- **Frontend**: https://order-front-frontend.vercel.app
- **Backend**: https://order-front-backend.vercel.app

---

## ⚙️ Vercel 환경 변수 설정 (필수)

### 1️⃣ Backend 환경 변수

**프로젝트**: `order-front-backend`

#### Vercel Dashboard 설정

1. **Vercel Dashboard 접속**
   ```
   https://vercel.com/dashboard
   ```

2. **Backend 프로젝트 선택**
   - `order-front-backend` → Settings → Environment Variables

3. **다음 환경 변수 추가**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NODE_ENV` | `production` | Production |
| `FRONTEND_URL` | `https://order-front-frontend.vercel.app` | Production |
| `DATABASE_URL` | `postgresql://postgres.liuaztalfeibucjoexvp:wlgudrms644@3.39.47.126:6543/postgres?pgbouncer=true&sslmode=require` | Production |
| `DIRECT_URL` | `postgresql://postgres.liuaztalfeibucjoexvp:wlgudrms644@3.39.47.126:5432/postgres?sslmode=require` | Production |

4. **Redeploy**
   - Settings → Deployments → 최신 배포 → ... → Redeploy

---

### 2️⃣ Frontend 환경 변수

**프로젝트**: `order-front-frontend`

#### Vercel Dashboard 설정

1. **Frontend 프로젝트 선택**
   - `order-front-frontend` → Settings → Environment Variables

2. **다음 환경 변수 추가**

| Variable Name | Value | Environment |
|---------------|-------|-------------|
| `NEXT_PUBLIC_API_URL` | `https://order-front-backend.vercel.app/api/v1` | Production |
| `NEXT_PUBLIC_USE_MOCK` | `false` | Production |
| `NEXT_PUBLIC_STORE_ID` | `1` | Production |
| `NEXT_PUBLIC_DEFAULT_STORE_TYPE` | `tacomolly` | Production |
| `NEXT_PUBLIC_DEFAULT_BRANCH_ID` | `gimpo` | Production |
| `NEXT_PUBLIC_ENABLE_QUERY_DEVTOOLS` | `false` | Production |
| `NEXT_PUBLIC_LOG_LEVEL` | `error` | Production |

3. **Redeploy**
   - Settings → Deployments → 최신 배포 → ... → Redeploy

---

## 🔍 설정 확인 방법

### Backend API 테스트

```bash
# Health Check
curl https://order-front-backend.vercel.app/health

# Swagger 문서
open https://order-front-backend.vercel.app/api/docs

# API 테스트
curl https://order-front-backend.vercel.app/api/v1/stores
```

### Frontend 테스트

```bash
# 메인 페이지 접속
open https://order-front-frontend.vercel.app

# 메뉴 페이지 접속
open https://order-front-frontend.vercel.app/tacomolly/gimpo/menu
```

---

## 🔒 보안 확인

### CORS 테스트

Backend가 Frontend만 허용하는지 확인:

```bash
# ✅ 허용된 Origin (성공)
curl -H "Origin: https://order-front-frontend.vercel.app" \
     https://order-front-backend.vercel.app/api/v1/stores

# ❌ 허용되지 않은 Origin (실패)
curl -H "Origin: https://malicious-site.com" \
     https://order-front-backend.vercel.app/api/v1/stores
```

### Rate Limiting 테스트

```bash
# 1초에 11번 요청 (10번 제한 초과)
for i in {1..11}; do
  curl https://order-front-backend.vercel.app/api/v1/stores
done

# 예상 결과: 11번째 요청에서 429 Too Many Requests
```

### Helmet.js 보안 헤더 확인

```bash
curl -I https://order-front-backend.vercel.app

# 확인할 헤더:
# X-Frame-Options: SAMEORIGIN
# X-Content-Type-Options: nosniff
# Strict-Transport-Security: max-age=15552000; includeSubDomains
```

---

## 📊 배포 후 모니터링

### Vercel Analytics

1. **Frontend 프로젝트** → Analytics
   - 페이지 뷰
   - 성능 지표 (Core Web Vitals)
   - 사용자 경로

2. **Backend 프로젝트** → Logs
   - API 요청 로그
   - 에러 로그
   - 실행 시간

### Supabase 에러 로그

```sql
-- error_logs 테이블 조회
SELECT * FROM error_logs
WHERE source = 'BACKEND'
ORDER BY "createdAt" DESC
LIMIT 100;
```

---

## 🚨 문제 해결

### 1. CORS 에러

**증상**:
```
Access to fetch at 'https://order-front-backend.vercel.app'
from origin 'https://order-front-frontend.vercel.app'
has been blocked by CORS policy
```

**해결**:
1. Backend 환경 변수 확인
   - `FRONTEND_URL=https://order-front-frontend.vercel.app`
2. Redeploy Backend
3. 브라우저 캐시 삭제 (Ctrl + Shift + R)

---

### 2. 500 Internal Server Error

**증상**: API 호출 시 500 에러

**확인 사항**:
1. Vercel Logs 확인
   - Backend 프로젝트 → Deployments → 최신 배포 → Functions
2. 환경 변수 확인
   - `DATABASE_URL` 정확한지 확인
3. Supabase 연결 확인
   - Supabase Dashboard → Database → Connection pooler 활성화

---

### 3. Database 연결 실패

**증상**: `Error: Can't reach database server`

**해결**:
1. Supabase IP 허용 목록 확인
   - Supabase Dashboard → Settings → Database
   - Connection pooling 활성화
2. `DATABASE_URL` 정확한지 확인
   - `pgbouncer=true` 포함 확인

---

## 🔄 재배포 방법

### 자동 배포 (GitHub 연동)

```bash
# main 브랜치에 Push 시 자동 배포
git add .
git commit -m "fix: update environment variables"
git push origin main
```

### 수동 배포 (Vercel CLI)

```bash
# Vercel CLI 설치
npm i -g vercel

# 로그인
vercel login

# Backend 배포
cd apps/backend
vercel --prod

# Frontend 배포
cd apps/frontend
vercel --prod
```

---

## 📌 체크리스트

### Backend 배포 전

- [ ] `FRONTEND_URL` 환경 변수 설정
- [ ] `NODE_ENV=production` 설정
- [ ] `DATABASE_URL` 프로덕션 DB 설정
- [ ] Vercel에서 환경 변수 확인
- [ ] Health Check 테스트

### Frontend 배포 전

- [ ] `NEXT_PUBLIC_API_URL` Backend URL 설정
- [ ] `NEXT_PUBLIC_USE_MOCK=false` 설정
- [ ] Vercel에서 환경 변수 확인
- [ ] 메인 페이지 접속 테스트
- [ ] API 연동 테스트

### 배포 후

- [ ] CORS 정책 작동 확인
- [ ] Rate Limiting 작동 확인
- [ ] Helmet.js 보안 헤더 확인
- [ ] Swagger 문서 접속 확인
- [ ] 실제 주문 플로우 테스트
- [ ] Supabase 에러 로그 확인

---

## 🎯 성공 기준

✅ Frontend에서 Backend API 호출 성공
✅ CORS 에러 없음
✅ Rate Limiting 작동 확인
✅ 보안 헤더 확인
✅ 주문 생성/조회 정상 작동
✅ Supabase DB 연결 정상

---

## 📚 참고 문서

- [Vercel Environment Variables](https://vercel.com/docs/projects/environment-variables)
- [Vercel Serverless Functions](https://vercel.com/docs/functions/serverless-functions)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [환경 변수 설정 가이드](./환경변수_설정_가이드.md)
