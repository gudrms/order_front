# 배포 가이드 (Deployment Guide)

이 문서는 개발/운영 환경 분리 및 배포 전략을 설명합니다.

---

## 🏗️ 환경 구성

### 1. 로컬 개발 (Local Development)

```
Frontend (apps/delivery-customer):
  URL: http://localhost:3001
  API: http://localhost:3000/api/v1
  DB: Supabase Dev

Backend (apps/backend):
  URL: http://localhost:3000
  DB: PostgreSQL (로컬) 또는 Supabase Dev
```

**설정**:
```env
# apps/delivery-customer/.env.local
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxx-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-key
NEXT_PUBLIC_USE_MOCK=true
```

### 2. 개발 서버 (Staging/Preview)

```
Frontend:
  URL: https://order-preview.vercel.app (Vercel Preview)
  API: https://api-dev.yourdomain.com
  DB: Supabase Dev

Backend:
  URL: https://api-dev.yourdomain.com (Railway/Render)
  DB: Supabase Dev
```

**Vercel 환경 변수** (Preview Environment):
```
NEXT_PUBLIC_API_URL=https://api-dev.yourdomain.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxx-dev.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dev-key
NEXT_PUBLIC_USE_MOCK=false
```

### 3. 운영 서버 (Production)

```
Frontend:
  URL: https://delivery.yourdomain.com (Vercel Production)
  API: https://api.yourdomain.com
  DB: Supabase Production

Backend:
  URL: https://api.yourdomain.com (Railway/Render)
  DB: Supabase Production
```

**Vercel 환경 변수** (Production Environment):
```
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1
NEXT_PUBLIC_SUPABASE_URL=https://xxx-prod.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=prod-key
NEXT_PUBLIC_USE_MOCK=false
NEXT_PUBLIC_TOSS_CLIENT_KEY=live_ck_xxx (실제 운영 키)
```

---

## 📦 백엔드 배포 옵션

### Option 1: Railway (권장)

**장점**:
- ✅ GitHub 자동 배포
- ✅ 무료 플랜 ($5 크레딧/월)
- ✅ PostgreSQL 자동 설정
- ✅ 환경 변수 관리 쉬움

**배포 방법**:

```bash
# 1. Railway CLI 설치
npm i -g @railway/cli

# 2. 로그인
railway login

# 3. 프로젝트 생성
cd apps/backend
railway init

# 4. 환경 변수 설정
railway variables set DATABASE_URL="postgresql://..."
railway variables set NODE_ENV="production"
railway variables set PORT="3000"
railway variables set CORS_ORIGIN="https://delivery.yourdomain.com"

# 5. 배포
railway up
```

**GitHub 연동 자동 배포**:
1. Railway Dashboard > Connect to GitHub
2. Repository 선택
3. Branch 설정 (main → Production, develop → Staging)
4. 푸시하면 자동 배포 ✅

### Option 2: Render

**장점**:
- ✅ 완전 무료
- ✅ YAML 설정 파일

**단점**:
- ⚠️ 콜드 스타트 (무료 플랜은 15분 유휴 시 슬립)

**배포 방법**:

`apps/backend/render.yaml` 생성:
```yaml
services:
  - type: web
    name: order-backend
    env: node
    region: singapore
    plan: free
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start:prod
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      - key: CORS_ORIGIN
        value: https://delivery.yourdomain.com
```

Render Dashboard에서 Blueprint 연결:
1. New > Blueprint
2. Repository 선택
3. `render.yaml` 자동 감지
4. 환경 변수 입력
5. Deploy ✅

### Option 3: Vercel (백엔드도 Vercel)

NestJS를 Vercel Serverless로 배포할 수 있지만:
- ⚠️ Serverless 제약 (긴 실행 시간 불가)
- ⚠️ 웹소켓 지원 제한

**적합한 경우**: 간단한 REST API만 있을 때

---

## 🎯 프론트엔드 배포 (Vercel)

### 1. Vercel CLI 배포

```bash
# 1. Vercel CLI 설치
npm i -g vercel

# 2. 로그인
vercel login

# 3. 프로젝트 연결
cd apps/delivery-customer
vercel

# 4. 환경 변수 설정
vercel env add NEXT_PUBLIC_API_URL production
vercel env add NEXT_PUBLIC_SUPABASE_URL production
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production

# 5. 운영 배포
vercel --prod
```

### 2. GitHub 자동 배포 (권장)

1. **Vercel Dashboard 연동**:
   - https://vercel.com/new
   - Import Git Repository
   - `order_front` 선택

2. **Root Directory 설정**:
   ```
   Root Directory: apps/delivery-customer
   Framework Preset: Next.js
   Build Command: cd ../.. && pnpm build --filter=delivery-customer
   Output Directory: .next
   Install Command: pnpm install
   ```

3. **환경 변수 설정**:
   - Settings > Environment Variables
   - Production / Preview / Development 별로 설정

4. **브랜치 배포 전략**:
   ```
   main 브랜치 → Production
   develop 브랜치 → Preview
   feature/* 브랜치 → Preview (자동)
   PR 생성 → Preview (자동)
   ```

---

## 🔄 배포 워크플로우

### 일반 기능 개발 → 배포

```bash
# 1. 기능 브랜치 생성
git checkout -b feature/payment-refund

# 2. 개발 (로컬)
# localhost:3001에서 테스트

# 3. 커밋 & 푸시
git add .
git commit -m "feat: 결제 환불 기능 추가"
git push origin feature/payment-refund

# 4. PR 생성
gh pr create --title "결제 환불 기능 추가" --base develop

# 5. Vercel Preview 자동 생성
# → https://order-xxx-git-feature-payment-preview.vercel.app
# → 팀원이 Preview 환경에서 테스트

# 6. 리뷰 후 develop 머지
# → develop 브랜치 Preview 배포

# 7. develop → main 머지
git checkout main
git merge develop
git push origin main

# 8. Production 자동 배포 ✅
# → https://delivery.yourdomain.com
```

### 핫픽스 (긴급 수정)

```bash
# 1. main에서 hotfix 브랜치 생성
git checkout main
git checkout -b hotfix/critical-bug

# 2. 수정 & 커밋
git add .
git commit -m "fix: 결제 실패 버그 수정"

# 3. main에 직접 머지
git checkout main
git merge hotfix/critical-bug
git push origin main

# 4. Production 즉시 배포 ✅

# 5. develop에도 백포트
git checkout develop
git merge hotfix/critical-bug
git push origin develop
```

---

## 🗄️ 데이터베이스 분리

### Supabase 프로젝트 분리 (권장)

**개발용**:
```
Project Name: order-system-dev
URL: https://abc123dev.supabase.co
Database: PostgreSQL (Supabase 호스팅)
```

**운영용**:
```
Project Name: order-system-prod
URL: https://xyz789prod.supabase.co
Database: PostgreSQL (Supabase 호스팅)
```

**설정 방법**:
1. Supabase Dashboard에서 2개 프로젝트 생성
2. 각각 스키마 동일하게 설정 (Prisma Migration 사용)
3. 환경별로 다른 URL 사용

```bash
# 개발 DB 마이그레이션
DATABASE_URL="https://abc123dev.supabase.co" pnpm prisma migrate dev

# 운영 DB 마이그레이션
DATABASE_URL="https://xyz789prod.supabase.co" pnpm prisma migrate deploy
```

### 로컬 PostgreSQL (선택)

로컬 개발 시 Supabase 대신 로컬 DB 사용 가능:

```bash
# Docker로 PostgreSQL 실행
docker run -d \
  --name order-postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=order_dev \
  -p 5432:5432 \
  postgres:15

# 환경 변수
DATABASE_URL="postgresql://postgres:password@localhost:5432/order_dev"
```

---

## 🔐 환경 변수 관리 Best Practices

### 1. .env.example 유지

모든 필수 환경 변수를 `.env.example`에 문서화:

```env
# .env.example
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# API
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1
NEXT_PUBLIC_STORE_ID=store-1

# 토스페이먼츠
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_your_test_key

# Mock 데이터
NEXT_PUBLIC_USE_MOCK=true
```

### 2. .env.local은 Git 제외

```gitignore
# .gitignore
.env
.env.local
.env*.local
```

### 3. Vercel 환경 변수는 Dashboard에서 관리

**절대 코드에 하드코딩하지 않기!**

❌ 나쁜 예:
```typescript
const API_URL = 'https://api.yourdomain.com'; // 하드코딩
```

✅ 좋은 예:
```typescript
const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';
```

---

## 🧪 환경별 테스트

### 로컬 테스트

```bash
cd apps/delivery-customer
pnpm dev
# → http://localhost:3001
```

### Preview 환경 테스트

1. PR 생성하면 Vercel이 자동으로 Preview URL 생성
2. GitHub PR 댓글에 링크 표시
3. Preview 환경에서 테스트

### Production 테스트

```bash
# Production 빌드 로컬 테스트
pnpm build
pnpm start

# 또는 Vercel 로컬 에뮬레이션
vercel dev
```

---

## 📊 모니터링

### Vercel Analytics

자동으로 포함됨:
- 페이지 로딩 속도
- Core Web Vitals
- 지역별 접속 통계

### 백엔드 로그

**Railway**:
- Dashboard > Deployments > Logs

**Render**:
- Dashboard > Logs

### 에러 트래킹 (선택)

Sentry 추가:
```bash
npm i @sentry/nextjs

# next.config.js에서 설정
```

---

## 🚀 배포 체크리스트

### 프론트엔드 배포 전

- [ ] 환경 변수 설정 완료
- [ ] `pnpm build` 로컬에서 성공
- [ ] 타입 에러 없음
- [ ] ESLint 경고 없음
- [ ] 테스트 통과

### 백엔드 배포 전

- [ ] 환경 변수 설정 완료
- [ ] Prisma Migration 완료
- [ ] 데이터베이스 연결 확인
- [ ] CORS 설정 확인
- [ ] API 테스트 통과

### 운영 배포 전

- [ ] develop 브랜치 충분히 테스트
- [ ] 데이터베이스 백업
- [ ] 롤백 계획 수립
- [ ] 사용자 공지 (다운타임 있는 경우)

---

## 🔄 롤백 전략

### Vercel 롤백

```bash
# CLI로 이전 배포로 롤백
vercel rollback

# 또는 Dashboard > Deployments > Promote to Production
```

### Railway 롤백

```bash
# 이전 deployment 선택 > Redeploy
```

### 데이터베이스 롤백

```bash
# Prisma Migration 롤백
pnpm prisma migrate resolve --rolled-back 20240108_migration_name

# 또는 Supabase 백업에서 복원
```

---

## 📝 환경별 요약

| 환경 | Frontend URL | Backend URL | Database | 배포 방법 |
|------|--------------|-------------|----------|-----------|
| **Local** | localhost:3001 | localhost:3000 | Supabase Dev | `pnpm dev` |
| **Preview** | xxx-preview.vercel.app | api-dev.domain.com | Supabase Dev | Git Push |
| **Production** | delivery.domain.com | api.domain.com | Supabase Prod | main 브랜치 푸시 |

---

## 🎯 추천 구성

**비용 최소화 (무료)**:
- Frontend: Vercel (무료)
- Backend: Render (무료, 콜드 스타트 있음)
- Database: Supabase (무료 플랜)

**안정적인 운영 (월 ~$10)**:
- Frontend: Vercel (무료)
- Backend: Railway ($5)
- Database: Supabase ($10 이하)

**대규모 트래픽 (월 ~$50+)**:
- Frontend: Vercel Pro
- Backend: AWS Lightsail / EC2
- Database: Supabase Pro 또는 AWS RDS

---

## 📚 참고 문서

- [Vercel 배포 가이드](https://vercel.com/docs/deployments/overview)
- [Railway 배포 가이드](https://docs.railway.app/deploy/deployments)
- [Render 배포 가이드](https://render.com/docs)
- [Supabase 프로젝트 관리](https://supabase.com/docs/guides/platform)
- [Prisma Migration](https://www.prisma.io/docs/concepts/components/prisma-migrate)
