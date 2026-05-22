# 배포 가이드

## Vercel 프로젝트 구성

모노레포에 5개 Vercel 프로젝트가 연결되어 있다. 현재 프론트 프로젝트는 repo root 기준으로 빌드 명령을 실행하고, 백엔드만 `apps/backend` Root Directory를 사용한다.

| Vercel 프로젝트 | 앱 | Root Directory | 도메인 |
|---|---|---|---|
| `order-front-backend` | backend | `apps/backend` | api.tacomole.kr |
| `order-admin` | admin | repo root | admin.tacomole.kr |
| `order-front-frontend` | table-order | repo root | order.tacomole.kr |
| `order-delivery` | delivery-customer | repo root | delivery.tacomole.kr |
| `order-website` | brand-website | repo root | tacomole.kr |

---

## 환경변수

`all-in-one-shared.env`를 Vercel **Shared Environment Variables**로 Import하면 전체 프로젝트에 일괄 적용된다.

```
Vercel Dashboard → Team Settings → Environment Variables → Import .env
```

로컬에서는 `pnpm sync:env`로 각 앱의 `.env.local`을 생성한다 ([로컬 세팅 참고](setup.md)).

Backend 운영 `DATABASE_URL`은 Supabase 서버리스용 pooler URL을 사용하고 Prisma가 과도한 per-instance pool을 열지 않도록 `pgbouncer=true`와 낮은 `connection_limit`부터 적용한다. `connection_limit` 값은 DB connection error와 query timeout을 보고 조정한다.

---

## 배포 흐름

`master` 브랜치에 push하면 변경된 앱만 자동 빌드된다.

```
git push origin master
  → Vercel이 변경된 파일 감지
  → 영향받는 프로젝트만 빌드 (selective deploy)
  → 약 3-5분 후 배포 완료
```

선택적 빌드 동작 기준 및 Ignored Build Step 수동 설정 방법은 [vercel-selective-deploy.md](vercel-selective-deploy.md) 참고.

---

## 백엔드 Serverless 구성

`apps/backend/vercel.json`에 두 개의 함수 엔트리포인트가 정의되어 있다.

| 파일 | 라우트 | maxDuration | 용도 |
|---|---|---|---|
| `api/index.ts` | `/api/v1/*` 전체 | 30초 | 일반 API |
| `api/queue.ts` | `/api/v1/queue/*` | 60초 | 큐 처리 (긴 작업) |

---

## DB 마이그레이션

배포 시 자동으로 `prisma migrate deploy`가 실행된다.

수동 실행:

```bash
pnpm --filter backend exec prisma migrate deploy
```

---

## 배포 확인

```bash
# 백엔드 헬스 체크
curl https://api.tacomole.kr/api/v1/health

# API 문서 (Scalar UI)
open https://api.tacomole.kr/api/docs
```

`admin.tacomole.kr`는 관리자 Next 앱이므로 `/health`가 없다. 헬스체크는 백엔드 도메인 `api.tacomole.kr/api/v1/health`로 확인한다.

---

## 배달 Android 앱 배포

`order-delivery` 웹 배포와 Play Console AAB 배포는 함께 확인한다. 배달 Android 앱은 운영 `delivery.tacomole.kr`을 원격 WebView로 로드하므로, 네이티브 번들이 같아도 운영 웹 JS 변경으로 시작 크래시나 OAuth 복귀 동작이 달라질 수 있다.

- AAB 생성, Play 테스트 트랙, 카카오 OAuth 앱 복귀, Firebase 푸시 활성화 조건은 `apps/delivery-customer/DEPLOYMENT.md`를 따른다.
- 앱 표시명과 런처 아이콘은 Play 스토어 등록정보 기준 `타코몰리`로 맞춘 뒤 versionCode를 올려 제출한다.
- 운영 확인용 로그 필터와 Remote WebView 핫픽스 판단 기준은 `docs/operator-handoff.md`의 Android 앱 운영 메모를 본다.

---

## GitHub Actions Cron 확인

콜드스타트 완화와 백그라운드 작업 처리는 `.github/workflows/backend-cron.yml`에서 5분마다 실행한다.

필수 GitHub Actions Secrets:

- `API_BASE_URL`: `https://api.tacomole.kr/api/v1`
- `INTERNAL_JOB_SECRET`: 백엔드 `INTERNAL_JOB_SECRET` 환경변수와 같은 값

실행 작업:

- `GET ${API_BASE_URL}/health`
- `POST ${API_BASE_URL}/queue/process-once`
- `POST ${API_BASE_URL}/payments/toss/expire-pending`
- `POST ${API_BASE_URL}/payments/toss/reconcile`

확인 절차:

1. GitHub 저장소의 `Actions` 탭으로 이동한다.
2. `Backend Cron Jobs` workflow를 선택한다.
3. `Run workflow`로 수동 실행한다.
4. 아래 step이 모두 성공하는지 확인한다.

```text
Validate cron secrets
Health check
Process Queue (MQ Consumer)
Expire Pending Toss Payments
Reconcile Toss Payments
```

`curl --fail-with-body`를 사용하므로 4xx/5xx 응답은 workflow 실패로 표시된다.

큐는 publish 직후 Vercel background wake-up도 사용한다. backend Vercel 환경변수 `BACKEND_QUEUE_PROCESS_URL`을 `https://api.tacomole.kr/api/v1/queue/process-once`로 설정하면 지연 없는 처리를 먼저 시도하고, 위 GitHub Actions cron은 wake-up 누락이나 실패 메시지를 회수하는 fail-safe로 유지된다. `INTERNAL_JOB_SECRET`은 두 경로에서 같은 값을 사용한다.

---

## CORS 허용 도메인

백엔드가 허용하는 Origin 목록 (`apps/backend/src/main.ts`):

- `https://tacomole.kr`, `https://www.tacomole.kr`
- `https://admin.tacomole.kr`
- `https://delivery.tacomole.kr`
- `https://order.tacomole.kr`
- `capacitor://localhost` (iOS 네이티브 WebView)
- `http://localhost:3000~3003` (개발 환경)

> **주의**: 현재 `NODE_ENV=development`이면 모든 origin + `credentials:true`를 허용한다 — P0 보안 항목으로 수정 예정.

---

## 수동 배포 (Vercel CLI)

```bash
npm i -g vercel
vercel login

cd apps/backend && vercel --prod
cd apps/admin   && vercel --prod
```

---

## 트러블슈팅

**CORS 에러**
- Vercel 대시보드 → backend 프로젝트 → Environment Variables에서 `ALLOWED_ORIGINS` 확인 후 Redeploy

**500 Internal Server Error**
- Vercel Dashboard → Deployments → 최신 배포 → Functions → 로그 확인
- `DATABASE_URL`, `SUPABASE_SERVICE_KEY` 누락 여부 확인

**빌드 실패 (`@order/*` 모듈 없음)**
- Vercel 프로젝트의 Root Directory가 앱 디렉터리(예: `apps/backend`)로 설정되어 있는지 확인
- Install Command: `cd ../.. && pnpm install --frozen-lockfile --prod=false`

**pgmq 큐 미처리**
- `POST /api/v1/queue/process-once` 수동 호출로 큐 즉시 처리 가능
- `INTERNAL_JOB_SECRET` 헤더 필요
