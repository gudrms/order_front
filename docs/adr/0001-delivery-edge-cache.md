# ADR-0001. 배달앱 공개 API를 엣지에 캐시하지 않는다

- 상태: **채택됨**
- 날짜: 2026-09-21
- 관련: `apps/delivery-customer/src/lib/cached-public-api.ts`, `apps/delivery-customer/src/app/api/revalidate/route.ts`, `apps/backend/src/common/utils/delivery-cache.ts`

## 배경

배달앱 공개 조회는 Next 라우트 핸들러(`/api/stores/...`)를 캐시 프록시로 두고, 백엔드가 쓰기할 때마다
`revalidateDeliveryCache` → `POST /api/revalidate` → `revalidateTag`로 태그를 무효화하는 구조였다.
"즉시 무효화되니 TTL을 길게 잡아도 신선도 손실이 없다"는 전제로 TTL을 300초까지 올려둔 상태였다
(서버리스 cold start 호출을 줄이려는 목적, [history.md](../history.md) 참고).

**그 전제가 틀렸다.** `publicCacheControl()`이 같은 TTL을 응답 헤더
`s-maxage=300, stale-while-revalidate=3600`으로도 내보내고 있었는데,
`revalidateTag`는 **Next 데이터 캐시만** 비우고 Vercel CDN의 응답 캐시는 건드리지 못한다.

2026-09-21 실측:

```
/api/stores                 → X-Vercel-Cache: HIT, Age: 18    (최신)
/api/stores/{id}/menus      → X-Vercel-Cache: HIT, Age: 167   (옛 메뉴 5건)
/api/stores/{id}/categories → X-Vercel-Cache: HIT, Age: 169   (삭제된 카테고리 포함)
```

메뉴를 33건으로 바꾸고 태그를 무효화한 뒤에도 CDN은 옛 응답을 계속 내보냈고,
`Age`가 `s-maxage`를 넘긴 뒤에야 갱신됐다.

**품절이 특히 문제였다.** 관리자가 품절 처리해도 고객 화면에는 최대 5분간 주문 가능하게 보인다.
주문 생성이 결제창보다 먼저 돌고 거기서 DB를 직접 읽어 막기 때문에 **돈이 나가지는 않지만**,
고객이 주소·연락처를 다 입력한 뒤 마지막 단계에서 거절당한다.

## 결정

응답 캐시와 데이터 캐시를 분리하고, **엣지에는 캐시하지 않는다.**

| 캐시 | 목적 | 값 |
|---|---|---|
| Next 데이터 캐시 (`next.revalidate`) | 백엔드 cold start 호출 감소 | 300초 **유지** |
| Vercel CDN 응답 (`Cache-Control`) | 엣지 레이턴시 | **`no-store`** |

`publicCacheControl()`이 데이터 캐시 TTL을 인자로 받던 것을 끊어, 두 값이 다시 엮이지 않게 했다.

## 결과

**얻은 것**
- 태그 무효화가 의도대로 즉시 반영된다. 품절·숨김·가격 변경이 곧바로 고객 화면에 나간다.
- cold start 방어는 그대로다. 데이터 캐시가 HIT면 백엔드를 호출하지 않는다.

**잃은 것**
- 요청마다 Next 함수가 실행된다. 엣지 HIT로 끝나던 트래픽이 함수 호출로 바뀐다.
  메뉴 화면 1회당 2건(categories, menus) 정도이고 Fluid Compute가 켜져 있어 현재 주문 규모에서는 무시할 수준으로 판단했다.
- 엣지 레벨의 트래픽 스파이크 흡수를 포기했다.

**대안으로 검토했다가 접은 것**
- `s-maxage=30` 절충: 변경이 한 줄이고 CDN 이점을 대부분 유지하지만, 품절 지연이 남는다.
- 품절 상태만 `no-store` 엔드포인트로 분리해 클라이언트에서 병합: 캐시 이점을 온전히 유지하지만
  코드가 늘어난다. 지금 규모에는 과하다고 보고 접었다.

**되돌리는 방법**

함수 호출 비용이 문제가 되면 `publicCacheControl()`의 반환값만 바꾸면 된다.
그때는 위 두 대안 중 하나로 가는 것이 맞고, **`s-maxage`를 다시 올리려면 품절 지연을 받아들이는 것**임을 기억할 것.
