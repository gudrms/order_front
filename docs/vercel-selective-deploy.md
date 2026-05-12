# Vercel Selective Deploy

이 저장소는 여러 Vercel 프로젝트가 같은 모노레포에 연결되어 있다. 전체 프로젝트가 매 push마다 빌드되지 않도록 각 프로젝트에 Ignored Build Step을 설정한다.

## 우선 확인할 Vercel 설정

각 Vercel 프로젝트의 Root Directory가 아래처럼 앱 디렉터리로 잡혀 있어야 한다.

| Vercel 프로젝트 | Root Directory |
|---|---|
| 관리자 웹 | `apps/admin` |
| 테이블 주문 | `apps/table-order` |
| 배달 고객 앱 | `apps/delivery-customer` |
| 백엔드 API | `apps/backend` |
| 브랜드 웹 | `apps/brand-website` |

Vercel의 모노레포 자동 스킵 기능이 켜져 있으면 수정되지 않은 프로젝트는 자동으로 스킵된다. 그래도 모든 프로젝트가 배포된다면 아래 Ignored Build Step을 추가한다.

## Ignored Build Step

Vercel Dashboard에서 각 프로젝트로 들어간다.

Settings -> Build and Deployment -> Ignored Build Step

각 프로젝트에 아래 명령을 넣는다.

| 프로젝트 | Ignored Build Step |
|---|---|
| 관리자 웹 | `node ../../scripts/vercel-ignore-build.js admin` |
| 테이블 주문 | `node ../../scripts/vercel-ignore-build.js table-order` |
| 배달 고객 앱 | `node ../../scripts/vercel-ignore-build.js delivery-customer` |
| 백엔드 API | `node ../../scripts/vercel-ignore-build.js backend` |
| 브랜드 웹 | `node ../../scripts/vercel-ignore-build.js brand-website` |

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

