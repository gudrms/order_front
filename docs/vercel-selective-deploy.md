# Vercel Selective Deploy

이 저장소는 여러 Vercel 프로젝트가 같은 모노레포에 연결되어 있다. 전체 프로젝트가 매 push마다 빌드되지 않도록 각 프로젝트에 Ignored Build Step을 설정한다.

## 현재 Vercel 프로젝트 매핑

대부분의 프론트 프로젝트는 Root Directory를 비워두고 repo root 기준으로 빌드 명령을 실행한다. 따라서 Ignored Build Step도 repo root 기준 경로인 `node scripts/...`를 사용한다.

| Vercel 프로젝트 | 앱 | Root Directory |
|---|---|---|
| `order-admin` | 관리자 웹 | repo root |
| `order-front-frontend` | 테이블 주문 | repo root |
| `order-delivery` | 배달 고객 앱 | repo root |
| `order-front-backend` | 백엔드 API | `apps/backend` |
| `order-website` | 브랜드 웹 | repo root |

Vercel의 모노레포 자동 스킵 기능만으로 부족하면 아래 Ignored Build Step을 추가한다. Root Directory를 앱 디렉터리로 바꾸는 경우에는 명령 경로도 `../../scripts/...`로 바뀌므로 주의한다.

## Ignored Build Step

Vercel Dashboard에서 각 프로젝트로 들어간다.

Settings -> Build and Deployment -> Ignored Build Step

각 프로젝트에 아래 명령을 넣는다.

| Vercel 프로젝트 | Ignored Build Step |
|---|---|
| `order-admin` | `node scripts/vercel-ignore-build.js admin` |
| `order-front-frontend` | `node scripts/vercel-ignore-build.js table-order` |
| `order-delivery` | `node scripts/vercel-ignore-build.js delivery-customer` |
| `order-front-backend` | `node ../../scripts/vercel-ignore-build.js backend` |
| `order-website` | `node scripts/vercel-ignore-build.js brand-website` |

## 동작 기준

- `docs/**`만 바뀌면 모든 Vercel 프로젝트 빌드를 스킵한다.
- `apps/admin/**` 또는 `packages/shared/**`, `packages/ui/**`가 바뀌면 관리자 웹을 빌드한다.
- `apps/table-order/**`, `packages/order-core/**`, `packages/shared/**`가 바뀌면 테이블 주문을 빌드한다.
- `apps/delivery-customer/**`, `packages/order-core/**`, `packages/shared/**`, `packages/ui/**`가 바뀌면 배달 고객 앱을 빌드한다.
- `apps/backend/**`, `packages/shared/**`가 바뀌면 백엔드 API를 빌드한다.
- `apps/brand-website/**`, `packages/shared/**`, `packages/ui/**`가 바뀌면 브랜드 웹을 빌드한다.
- `.npmrc`, `package.json`, `pnpm-lock.yaml`, `pnpm-workspace.yaml`, `turbo.json`이 바뀌면 전체 프로젝트를 빌드한다.

## 로컬 확인

커밋 직후 아래처럼 확인할 수 있다.

```powershell
node scripts/vercel-ignore-build.js admin
```

종료 코드 의미:

- `0`: Vercel이 빌드를 스킵한다.
- `1`: Vercel이 빌드한다.

