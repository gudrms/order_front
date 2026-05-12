# 배포 가이드

## Vercel 프로젝트 구성

모노레포에 5개 Vercel 프로젝트가 연결되어 있다. 각 프로젝트의 Root Directory를 반드시 아래와 같이 설정해야 한다.

| Vercel 프로젝트 | Root Directory | 도메인 |
|---|---|---|
| backend | `apps/backend` | api.tacomole.kr |
| admin | `apps/admin` | admin.tacomole.kr |
| table-order | `apps/table-order` | order.tacomole.kr |
| delivery-customer | `apps/delivery-customer` | delivery.tacomole.kr |
| brand-website | `apps/brand-website` | tacomole.kr |

---

## 환경변수

`all-in-one-shared.env`를 Vercel **Shared Environment Variables**로 Import하면 전체 프로젝트에 일괄 적용된다.

```
Vercel Dashboard → Team Settings → Environment Variables → Import .env
```

로컬에서는 `pnpm sync:env`로 각 앱의 `.env.local`을 생성한다 ([로컬 세팅 참고](setup.md)).

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
curl https://api.tacomole.kr/health

# API 문서 (Scalar UI)
open https://api.tacomole.kr/api/docs
```

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
