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

### 변경 범위를 어떻게 구하나

`VERCEL_GIT_PREVIOUS_SHA`(직전 배포 커밋)부터 `VERCEL_GIT_COMMIT_SHA`까지를 비교한다.
**이 범위를 확정할 수 없으면 스킵하지 않고 빌드한다.**

| 상황 | 동작 |
|---|---|
| `VERCEL_GIT_PREVIOUS_SHA` 있음 | 그 범위의 변경으로 판정 |
| `VERCEL_GIT_PREVIOUS_SHA` 없음 | 빌드 |
| shallow clone이라 그 커밋이 없어 diff 실패 | 빌드 |
| 범위는 구했으나 변경 파일이 0건 | 빌드 |

잘못 빌드하면 빌드 한 번을 낭비하지만, **잘못 스킵하면 수정이 조용히 배포되지 않는다.** 그래서 불확실할 때는 빌드 쪽으로 기운다.

> 2026-09-21 이전에는 `VERCEL_GIT_PREVIOUS_SHA`가 없을 때 `HEAD^..HEAD` 한 커밋만 비교했다.
> 여러 커밋을 한 번에 푸시하면 Vercel이 중간 커밋을 건너뛰고 마지막 커밋만 빌드하는데,
> 그때 이 비교는 건너뛴 커밋의 변경을 보지 못한다. 예를 들어 팁 커밋이 `docs/**`만 바꿨고
> 배달앱 수정이 바로 앞 커밋에 있으면, **배달앱 빌드가 스킵된다.**
> 비어 있지 않은 목록이라 확정된 결과로 취급된다는 점이 특히 위험했다.

## 로컬 확인

커밋 직후 아래처럼 확인할 수 있다.

```powershell
node scripts/vercel-ignore-build.js admin
```

종료 코드 의미:

- `0`: Vercel이 빌드를 스킵한다.
- `1`: Vercel이 빌드한다.

