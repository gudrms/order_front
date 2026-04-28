# Toss POS 플러그인 실기기 E2E 테스트 플랜

작성: 2026-04-28 / 출시 전 마지막 게이트

## 0. 사전 준비 (실기기 테스트 시작 전 모두 ✓)

### 환경변수 (`apps/toss-pos-plugin/.env`)
- [ ] `PLUGIN_API_URL` — 백엔드 API base URL. **토스 POS에서 접근 가능한 HTTPS** (localhost 불가)
- [ ] `PLUGIN_SUPABASE_URL` — `https://xxx.supabase.co`
- [ ] `PLUGIN_SUPABASE_ANON_KEY` — `sb_...`
- [ ] `PLUGIN_STORE_ID` — 테스트할 매장 ID (Supabase `Store` 테이블 id 확인)

### 백엔드 도달성
- [ ] `PLUGIN_API_URL`/health (또는 `/pos/orders/pending`)에 외부에서 GET 200 OK 받는지 확인
- [ ] CORS/방화벽 차단 없음

### Supabase Realtime
- [ ] Dashboard > Database > Replication에서 `Order` 테이블의 Realtime publication ON
- [ ] Realtime Inspector(`https://supabase.com/dashboard/project/<id>/realtime/inspector`)에서 `pos-orders` 채널 구독 가능 확인

### 플러그인 번들
- [ ] `pnpm zip` 실행 → 새로운 `plugin.zip` 생성 (`apps/toss-pos-plugin/plugin.zip`)
- [ ] 토스 개발자센터(https://place.toss.im/developer)에 업로드 → 검수/배포 완료
- [ ] 테스트 매장에 플러그인 활성화

### 검증 도구 5개 동시 띄우기
1. **토스 POS 기기 화면** — 주문 들어오는지 직접 보기
2. **배달 customer 앱** — 주문 시뮬레이션 (test_ck 키로 결제까지)
3. **Supabase Dashboard > Order 테이블** — `status`/`tossOrderId` 변화 추적
4. **백엔드 로그** — `[PosController]` 로그 확인 (Idempotency-Key, 409 등)
5. **플러그인 콘솔** — 토스 개발자센터의 플러그인 디버그 콘솔 (가능하면)

---

## 시나리오 1. 카드 결제 → POS 정상 등록 (Happy Path)

**가장 중요한 시나리오. 실패하면 모든 후속 시나리오 의미 없음.**

### 사전 상태
- 테스트 매장 영업 중 (`isActive = true`, `isDeliveryEnabled = true`)
- 메뉴 1개 이상이 POS에 등록돼 있고 동기화돼 있음 (`tossMenuCode != null`)
- 플러그인이 활성화돼 있고 `setupRealtime()` 로그가 떠 있음

### 단계
| # | 액션 | 위치 | 기대 결과 |
|---|---|---|---|
| 1 | 배달 customer 앱에서 메뉴 담고 체크아웃 → 토스페이먼츠 결제(테스트키) 완료 | 배달앱 | `/order/success` 도달 |
| 2 | Supabase Order 테이블 새 row 확인 | Dashboard | `status: 'PENDING_PAYMENT'` → 곧 `'PAID'`로 전이 |
| 3 | Realtime 또는 polling으로 플러그인이 PAID 감지 | 플러그인 콘솔 | `Order ... reached PAID, triggering POS registration` 로그 |
| 4 | 플러그인이 `posPluginSdk.order.add` + `payment.add` 호출 | 플러그인 콘솔 | `Toss POS Order Created: <tossOrderId>` + `Toss POS Payment registered: <paymentKey>` |
| 5 | POS 기기 화면에 주문 등장 | POS 화면 | 주문번호/메뉴/금액 + **결제완료** 상태 |
| 6 | 백엔드 PATCH 호출 (Idempotency-Key 헤더 동봉) | 백엔드 로그 | `PATCH /pos/orders/<id>/status idempotencyKey=order-<id>-CONFIRMED` |
| 7 | DB 상태 변화 | Order 테이블 | `status: 'CONFIRMED'`, `tossOrderId: <toss id>` 박힘 |

### PASS 기준
- 단계 1~7 모두 1분 이내에 완료
- POS 화면에 주문이 **결제 완료(미결제 아님)** 상태로 표시
- DB가 최종적으로 `CONFIRMED + tossOrderId 있음`

### FAIL 시 점검
- 단계 3 안 옴 → Realtime 미연결 (Supabase Realtime publication off 또는 환경변수 오류)
- 단계 4에서 `order.add` 실패 → 메뉴 매핑 누락 (catalogId null) — 콘솔에 `매장 메뉴 매핑 누락` 토스트 떠야 정상
- 단계 5에서 미결제 표시 → `payment.add` 실패. `Payment registration failed` 로그 + 자동 cancel 동작 확인
- 단계 7 안 옴 → PATCH 실패. 백엔드 도달 불가 또는 권한 문제. 3회 재시도 후 `Toss POS order ... cancelled` 로그 + 다음 폴링에서 재시도

---

## 시나리오 2. 배달앱 → POS 취소 동기화

### 사전 상태
- 시나리오 1 완료 (DB CONFIRMED + tossOrderId 있는 주문 1건)

### 단계
| # | 액션 | 위치 | 기대 결과 |
|---|---|---|---|
| 1 | DB에서 해당 주문 `status = 'CANCELLED'`로 직접 UPDATE (또는 admin 취소 UI) | Supabase | UPDATE 성공 |
| 2 | 플러그인 Realtime UPDATE 감지 | 플러그인 콘솔 | `Order ... cancelled from delivery app, cancelling in Toss POS` |
| 3 | `posPluginSdk.order.cancel(tossOrderId)` 호출 | 플러그인 콘솔 | `Toss POS order <toss id> cancelled` |
| 4 | POS 화면에서 해당 주문 사라짐(또는 취소 표시) | POS 화면 | 주문 상태 = 취소 |

### PASS 기준
- 5초 이내에 POS 화면에 반영

### FAIL 시 점검
- 단계 2 안 옴 → Realtime 안 연결됨. 시나리오 1로 회귀.
- 단계 3 에러 → 토스 POS에 해당 tossOrderId가 없음 (이미 취소됐거나, 시나리오 1 단계 7이 실패했음)

---

## 시나리오 3. POS → 백엔드 결제 취소 동기화

**`order.on('cancel')` deprecated 처리 검증의 핵심 시나리오.** 새로 박은 `payment.on('cancel')` 경로가 실제로 동작하는지.

### 사전 상태
- 시나리오 1 완료 (CONFIRMED + tossOrderId)

### 단계
| # | 액션 | 위치 | 기대 결과 |
|---|---|---|---|
| 1 | POS 화면에서 해당 주문의 결제 취소 (사장님이 직접) | POS 화면 | POS상 결제 취소됨 |
| 2 | 플러그인 `payment.on('cancel')` 콜백 실행 | 플러그인 콘솔 | `Payment cancelled in Toss POS for tossOrderId=<id> → backend orderId=<id>` |
| 3 | 플러그인이 `GET /pos/orders/by-toss-id/<tossOrderId>` 호출 | 백엔드 로그 | 200 OK + 백엔드 orderId 반환 |
| 4 | 플러그인이 `PATCH /pos/orders/<orderId>/status` (status=CANCELLED) 호출 | 백엔드 로그 | `idempotencyKey=order-<id>-CANCELLED` |
| 5 | DB 상태 | Order 테이블 | `status: 'CANCELLED'` |

### PASS 기준
- 10초 이내 DB CANCELLED 반영

### FAIL 시 점검
- 단계 2 안 옴 → SDK 0.0.16+에서 `payment.on('cancel')` 시그니처 다를 수 있음. payload 구조 콘솔에서 확인 후 `(payment as any).orderId` 추출 로직 점검
- 단계 3 404 → DB에 `tossOrderId` 박힌 주문이 없음 (시나리오 1 단계 7 실패)

---

## 시나리오 4. 결제 timeout 통합 (GPT 작업분과의 호환성)

### 사전 상태
- 새 주문 생성 후 **결제 미완료 상태로 15분 방치**
- (또는 백엔드 cron으로 `expirePendingTossPayments` 강제 트리거)

### 단계
| # | 액션 | 위치 | 기대 결과 |
|---|---|---|---|
| 1 | 결제 미완료 주문 생성 (체크아웃까지만 가고 결제 위젯 닫음) | 배달앱 | DB에 `status: 'PENDING_PAYMENT'` 생성 |
| 2 | 15분 방치 (또는 cron 강제 실행) | - | 백엔드 timeout 작업 실행 |
| 3 | DB 상태 변화 | Order 테이블 | `status: 'CANCELLED'`, `cancelReason: 'Payment timed out before approval'` |
| 4 | 플러그인 동작 | 플러그인 콘솔 | **아무것도 안 일어나야 함** (Realtime UPDATE 핸들러는 `CANCELLED + tossOrderId`만 처리, 여기는 tossOrderId null) |
| 5 | POS 화면 | POS 화면 | **이 주문 등장 안 함** |

### PASS 기준
- 만료된 주문이 POS에 안 들어감
- 플러그인 콘솔에 에러/경고 없음

### FAIL 시 점검
- POS에 등장 → pollOrders where절 깨짐 (status=PAID 아닌데 들어감). 백엔드 `getPendingOrders` 점검
- 플러그인 에러 로그 → Realtime UPDATE 핸들러 분기 잘못 탐. `CANCELLED && !tossOrderId` 케이스 누수

---

## 시나리오 5. 카탈로그 추가/수정/삭제 동기화

### 사전 상태
- POS에 메뉴 카테고리 1개 이상

### 단계
| # | 액션 | 위치 | 기대 결과 |
|---|---|---|---|
| 1 | POS에서 메뉴 1개 추가 | POS 화면 | catalog `add` 이벤트 발생 |
| 2 | 플러그인이 800ms 디바운스 후 `getCatalogs()` + `POST /pos/catalogs/sync` | 플러그인 콘솔 | `Fetched N catalogs from Toss POS` + `Catalog sync complete: N items` |
| 3 | DB Menu/MenuOptionGroup/MenuOption 갱신 | Supabase | 새 메뉴 + 옵션 그룹 + 옵션 row들 생성 |
| 4 | POS에서 옵션 그룹 수정 (예: 매운맛 옵션 추가) | POS 화면 | catalog `update` 이벤트 |
| 5 | 동일하게 디바운스 후 sync | 백엔드 | MenuOption upsert로 새 옵션 row 생성 |
| 6 | POS에서 메뉴 1개를 SOLD_OUT 상태로 변경 | POS 화면 | catalog `update` |
| 7 | DB 메뉴 row | Menu 테이블 | `soldOut: true` |
| 8 | POS에서 메뉴 삭제 | POS 화면 | catalog `delete` |
| 9 | DB 메뉴 row | Menu 테이블 | `isActive: false` (논리삭제) |
| 10 | POS에서 5개 메뉴를 빠르게 연속 수정 | POS 화면 | **단 1번의 sync 호출만 발생** (디바운스 동작 검증) |

### PASS 기준
- 단계 10에서 `Catalog sync complete` 로그가 정확히 1번만 찍힘 (마지막 수정 후 800ms 뒤)
- Rate limit 에러(`PosPluginSdkRateLimitError`) 안 뜸

### FAIL 시 점검
- 단계 10에서 sync 여러 번 호출 → 디바운스 깨짐. `scheduleSync` 호출부 확인
- Rate limit 에러 → 디바운스 800ms 부족. 1500ms로 늘리거나 SDK 호출 개수 줄이기

---

## 시나리오 6 (선택). 신뢰성 시나리오 — 회복 가능성 검증

### 6-1. 플러그인 재시작 중복 방지

| # | 액션 | 기대 결과 |
|---|---|---|
| 1 | 시나리오 1 단계 4까지 진행 (order.add + payment.add 성공) | tossOrderId-1 생성 |
| 2 | **PATCH 직전 플러그인 강제 재시작** (POS 기기에서 플러그인 비활성화 후 재활성화) | tossOrderId-1이 토스 POS에 떠있음, DB는 tossOrderId 없음 |
| 3 | 플러그인 재시작 후 polling 재개 → 같은 주문 재처리 시도 | order.add → tossOrderId-2 생성 → payment.add → PATCH 시도 |
| 4 | 백엔드가 409 반환 (이미 tossOrderId-1 박혀있다고 가정 시) **또는** PATCH 성공 (tossOrderId 미박혀있으면 tossOrderId-2로 박힘) | 둘 중 하나, **무한 루프 안 발생** |
| 5 | 만약 409 받음 | 플러그인이 tossOrderId-2를 cancel → POS에 tossOrderId-1만 남음 |

### 6-2. 백엔드 일시 다운 → 복구

| # | 액션 | 기대 결과 |
|---|---|---|
| 1 | 시나리오 1 단계 5 직후 백엔드 강제 셧다운 | PATCH 3회 재시도 모두 실패 |
| 2 | 플러그인 콘솔 | `Order ... PATCH failed after retries — cancelling Toss POS order ... for clean retry` + 토스트 |
| 3 | POS 화면에서 주문 사라짐 (cancel됨) | tossOrderId-1 사라짐 |
| 4 | 백엔드 복구 | - |
| 5 | 다음 polling | 같은 주문 재처리 → tossOrderId-2 + PATCH 성공 |

---

## 실패 발생 시 디버깅 절차

1. **플러그인 콘솔 로그부터 확인** — 어느 단계에서 끊겼는지
2. **백엔드 로그** — `[PosController]` Idempotency-Key, status, tossOrderId 추적
3. **Supabase Order 테이블** — `status`, `tossOrderId`, `paymentStatus` 현재 값
4. **Supabase Realtime Inspector** — `pos-orders` 채널이 SUBSCRIBED 상태인지
5. **재현 가능하면**: 해당 시나리오 캡처 + 로그 모아서 다음 세션에 공유

## 출시 게이트 통과 기준

- 시나리오 1~5 모두 PASS
- 시나리오 6은 권장이지만 강제 아님
- 발견된 이슈는 토스 플러그인 체크리스트의 "남은 일" 섹션에 기록
