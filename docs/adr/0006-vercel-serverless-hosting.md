# ADR-0006. 호스팅은 Vercel Serverless + Supabase로 간다

- 상태: **채택됨**
- 날짜: 2025-12-26 (기록 정리 2026-09-22)
- 관련: `docs/deployment.md`, `docs/vercel-selective-deploy.md`, [ADR-0001](0001-delivery-edge-cache.md), [ADR-0005](0005-pgmq-message-queue.md)

## 배경

1인 개발로 시작한 프로젝트다. 서버 프로비저닝·패치·모니터링에 시간을 쓸 여력이 없었고,
앱이 늘어날 것(테이블오더 → 관리자 → 배달앱 → 브랜드 사이트)이 예상됐다.

## 결정

**Vercel Serverless**(Next.js 앱 4개 + NestJS 백엔드)와 **Supabase**(PostgreSQL + Auth + Realtime)로 간다.

- 서버 관리가 없다. 배포는 git push로 끝난다.
- 모노레포에서 프로젝트를 나눠 배포할 수 있다.
- Supabase가 DB·인증·Realtime을 한 번에 줘서 초기 개발 속도가 크게 올라간다.
  큐까지 같은 DB에서 해결했다([ADR-0005](0005-pgmq-message-queue.md)).

## 결과

**얻은 것**
- 인프라 운영 시간이 사실상 0. 기능 개발에만 시간을 쓸 수 있었다.
- 글로벌 CDN과 프리뷰 배포가 기본으로 딸려온다.

**대가로 치른 것 — 전부 실제로 부딪힌 것들이다**

| 제약 | 어떻게 드러났나 | 대응 |
|---|---|---|
| **상시 실행 프로세스 없음** | 큐 consumer를 둘 곳이 없다 | cron + publish 직후 wake-up ([ADR-0005](0005-pgmq-message-queue.md)) |
| **cold start** | 배달앱 첫 진입이 NestJS 부팅을 탄다 | Fluid Compute, Swagger lazy 생성, Sentry profiling 제거, 데이터 캐시 TTL 상향 (history 17번) |
| **엣지 캐시와 무효화 불일치** | `revalidateTag`가 CDN 응답 캐시를 못 지워 품절이 최대 5분 늦게 반영됐다 | 엣지 캐시를 끄고 Next 데이터 캐시에만 의존 ([ADR-0001](0001-delivery-edge-cache.md)) |
| **Hobby 플랜 배포 한도** | 2026-09-21에 걸려 반나절 배포가 멈췄다. 스킵된 배포와 dev 프리뷰도 한도를 먹는다 | 커밋은 나누되 푸시는 묶는다. `vercel-ignore-build.js`로 불필요한 빌드 제거 |
| **동시 빌드 1개** | 5개 프로젝트가 순차로 빌드돼 큐가 밀린다 | 위와 동일 |
| **플랫폼 헤더 의존** | rate limit이 `x-forwarded-for`를 믿으면 우회 가능 | 플랫폼이 채우는 헤더를 먼저 신뢰 (`docs/architecture.md` 「프록시 헤더 신뢰 정책」) |

**정리하면**, 서버리스는 운영 부담을 없애는 대신 **"상시 실행이 없다"와 "캐시·배포를 플랫폼이 통제한다"**는
두 가지를 계속 우회하게 만든다. 지금까지는 우회 비용이 서버 운영 비용보다 낮았다.

**언제 다시 볼 것인가**

아래 중 하나가 오면 재검토한다.

- 주문량이 늘어 큐 깨우기 지연이나 DB 폴링 부하가 체감될 때
- 배포 빈도가 Hobby 한도에 계속 걸릴 때 (Pro 업그레이드가 서버 운영보다 싸다면 그쪽이 먼저다)
- 상시 워커가 필요한 기능(실시간 배차, 장시간 배치)이 생길 때

**미검증으로 남은 것**

NCP 등 자체 서버 대비 비용 비교는 아직 문서화되지 않았다.
checkList.md의 `docs/cost-model.md` 작성 항목에 열려 있다.
