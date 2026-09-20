# 어드민 쿠폰 관리 화면 개발 요청서

> 작성: 2026-09-20
> 진행 상태: 2026-09-20 화면 구현 및 모의 API E2E 완료. `80fd615`, `caf9c4e`를 `origin/master`에 푸시 완료. 실 API·배포 확인은 미완료.
> 대상: 이 작업을 맡을 개발 세션 (이 문서만 보고 착수 가능하도록 작성)

---

## 1. 배경 — 왜 필요한가

쿠폰 기능은 **백엔드 API와 고객 화면은 이미 완성**되어 있습니다.

| 영역 | 상태 |
|---|---|
| 쿠폰 DB 스키마 (`Coupon`, `UserCoupon`) | ✅ 완료 |
| 쿠폰 생성/목록/발급 API | ✅ 완료 |
| 고객: 보유 쿠폰 조회, 결제 시 적용 | ✅ 완료 |
| 고객: 프로모 코드 등록 | ✅ 완료 |
| **어드민: 쿠폰을 만드는 화면** | ✅ ADMIN 전용 `/coupons` 구현 |

착수 당시에는 쿠폰 생성 화면이 없었습니다. 현재는 생성·목록·사용자 ID 직접 발급 화면을 구현했으며, 실운영 전 검증과 서버 보완 사항은 아래 체크리스트에 남겨두었습니다.

이 작업은 **어드민에 쿠폰 관리 화면을 추가**하는 범위로 완료했습니다. 백엔드와 할인 계산 로직은 변경하지 않았으며, 확인된 발급 한도 문제는 별도 보완이 필요합니다.

---

## 2. 사용하는 기존 API

모두 `SupabaseGuard` 적용, **`role === 'ADMIN'` 인 사용자만 호출 가능** (OWNER 불가).
백엔드 경로: `apps/backend/src/modules/coupons/`

### 2-1. 쿠폰 생성 — `POST /coupons`

```ts
{
  name: string;                 // 필수. 예: "신규 가입 쿠폰"
  description?: string;
  code?: string;                // 프로모 코드. 없으면 관리자 직접 발급 전용
  type: 'PERCENTAGE' | 'FIXED_AMOUNT';   // 필수
  discountValue: number;        // 필수. 정률이면 1~100, 정액이면 원
  maxDiscountAmount?: number;   // 정률 할인 상한. 기본 5000
  minOrderAmount?: number;      // 최소 주문금액
  maxUses?: number;             // 총 발급 한도. 없으면 무제한
  defaultExpiryDays?: number;   // 발급 시 유효기간(일). 기본 30, 최대 365
}
```

서버 검증: 정률인데 `discountValue`가 1~100 밖이면 400.
`FIXED_AMOUNT`로 만들면 `maxDiscountAmount`는 서버에서 무시/정리됩니다.

### 2-2. 쿠폰 목록 — `GET /coupons`

`Coupon[]` 반환 (최신순). 주요 필드: `id, name, description, code, type, discountValue, maxDiscountAmount, minOrderAmount, isActive, maxUses, usedCount, defaultExpiryDays, createdAt`

### 2-3. 사용자에게 발급 — `POST /coupons/:couponId/issue`

```ts
{ userId: string; expiryDays?: number }   // expiryDays 생략 시 쿠폰의 defaultExpiryDays 적용
```

비활성 쿠폰이거나 없는 사용자면 404.

### 2-4. 활성/비활성 전환 — `PATCH /coupons/:couponId/active`

```ts
{ isActive: boolean }
```

> **참고**: 쿠폰 내용 수정/삭제 API는 아직 없습니다.

---

## 3. 만들 화면

`apps/admin/src/app/(dashboard)/coupons/page.tsx` 신규 생성.

### 3-1. 쿠폰 생성 폼

| 입력 | 비고 |
|---|---|
| 쿠폰 이름 | 필수 |
| 설명 | 선택 |
| 할인 타입 | 정액 / 정률 라디오 or 토글 |
| 할인값 | 타입에 따라 단위 표기 변경 (원 / %) |
| 정률 상한 | **정률 선택 시에만 노출**. 기본값 5000 채워두기 |
| 최소 주문금액 | 선택 |
| 총 발급 한도 | 선택. 미입력 = 무제한 |
| 유효기간(일) | 기본 30 |
| 프로모 코드 | 선택. 입력하면 고객이 직접 등록 가능 |

**UX 요구사항**
- 정률 선택 시 상한 미입력 상태로 제출되지 않게 할 것 (상한 없으면 고액 주문에서 할인액이 무한정 커짐)
- 정액으로 전환하면 상한 입력은 숨기기

### 3-2. 쿠폰 목록

카드 또는 테이블로 표시. 각 항목에 노출할 것:
- 이름 / 설명
- 할인 표시: `3,000원 할인` 또는 `10% 할인 (최대 5,000원)`
- 최소 주문금액 (있으면)
- **사용 현황**: `usedCount / maxUses` (무제한이면 `12 / 무제한`)
- 프로모 코드 (있으면, 복사 버튼 있으면 좋음)
- 유효기간, 활성 여부, 생성일

### 3-3. 사용자 발급

목록의 각 쿠폰에서 "발급" 액션 → 사용자 지정 후 `POST /coupons/:id/issue`.

사용자 선택 UX는 판단에 맡깁니다. 참고로 계정 목록 화면(`/accounts`)이 이미 있으니 그쪽 조회 방식을 참고하거나, 최소한 `userId` 직접 입력이라도 동작하게 하면 됩니다.

---

## 4. 어드민 앱 컨벤션 (반드시 따를 것)

이 저장소의 어드민은 아래 패턴으로 통일되어 있습니다. 새 화면도 동일하게 작성하세요.

1. **API 호출은 `adminApi`** (`@/lib/adminApi`) 사용. 직접 `axios`/`fetch` 금지.
   인증 헤더는 `useAdminStore()`의 `authHeaders`를 넘깁니다.

2. **조회는 react-query `useQuery`**, 변경은 `useMutation` + 성공 시 `invalidateQueries`.

3. **조회 실패를 빈 목록으로 감추지 말 것.** 이 저장소에서 실제로 사고가 났던 부분입니다 —
   `data || []`만 쓰면 백엔드 500이 "쿠폰 없음"과 똑같이 보입니다.
   `isError`일 때 **에러 배너 + 다시 시도 버튼**을 노출하세요.
   기존 구현 참고: `apps/admin/src/app/(dashboard)/operations/page.tsx`, `banners/page.tsx`

4. **에러 메시지는 `getHttpErrorMessage`** (`@/lib/httpError`) 사용.

5. **사이드바 등록**: `apps/admin/src/lib/adminPermissions.ts`의 `adminNavItems`에 추가.
   ```ts
   { name: '쿠폰 관리', href: '/coupons', icon: Ticket, roles: ['ADMIN'] },
   ```
   백엔드가 `ADMIN`만 허용하므로 **`roles`는 반드시 `['ADMIN']`** (OWNER 넣으면 화면은 보이는데 403).

6. 화면 구조·톤은 `banners/page.tsx`가 가장 가까운 선례입니다 (마스터 관리자 전용 + 생성 폼 + 목록).

---

## 5. 정책 — 쿠폰을 어떻게 발행할지

**[docs/coupon-strategy.md](../coupon-strategy.md)** 를 반드시 먼저 읽으세요. 요약:

- **기본은 정액(FIXED_AMOUNT) 권장.** 비용이 예측 가능하고 소액 주문 전환에 유리.
- 정률을 쓴다면 **상한 필수**.
- **쿠폰 할인은 배달비를 제외한 상품 금액에만 적용됩니다** (2026-09-20 확정). 쿠폰의 최소 주문금액 판정도 상품 금액 기준.
- 쿠폰 최소 주문금액은 **매장 최소 주문금액 이상**으로 잡아야 역마진이 나지 않습니다.

이 계산 기준은 서버(`delivery-order.service.ts`)와 배달앱 결제 화면 양쪽에 이미 반영되어 있습니다. **이번 작업에서 계산 로직을 건드릴 일은 없습니다.**

---

## 6. 검증

- [x] `pnpm --filter admin exec tsc --noEmit -p tsconfig.json` 통과
- [x] 모의 ADMIN 세션·API로 쿠폰 생성 요청 → 목록 갱신 확인
- [x] 정률 상한 누락 시 제출 차단, 상한 요청값 확인, 정액 전환 시 상한 입력 숨김·요청에서 제외
- [x] 사용자 ID 발급 요청, 기본/별도 유효기간 전달, 실패 시 입력 유지, 비활성 쿠폰 발급 버튼 비활성화
- [x] OWNER 메뉴 미노출 및 직접 URL 접근 차단
- [ ] 실 ADMIN 계정·API로 쿠폰 생성 및 정률 상한 DB 저장 확인
- [ ] 발급한 쿠폰이 배달앱 고객 화면(마이페이지 > 쿠폰)에 보이는지
- [ ] 결제 화면에서 해당 쿠폰 적용 시 **상품 금액 기준**으로 할인되는지 (배달비 제외 확인)
- [x] 모의 조회 API 500일 때 빈 목록 대신 에러 배너 표시 및 재시도 복구
- [ ] ESLint 검증: 관리자 앱의 ESLint 설정 파일 부재로 실행 불가

`e2e/admin/coupons.spec.ts`의 모의 API E2E 4개 통과. 실제 고객 앱 수신·결제 및 배포 상태는 이 테스트로 확인하지 않았습니다.

### 실운영 전 보완 및 범위 제외

- [x] **총 발급 한도 보장** (2026-09-21): 한도 판정을 사용 수(`usedCount`) → **발급 수**(`UserCoupon` 개수) 기준으로 변경하고, 검사가 아예 없던 관리자 직접 발급 경로에도 동일 가드 적용. 동일 고객 재발급도 양쪽에서 400으로 차단(기존에는 관리자 발급 시 DB 유니크 오류로 500). 단위 테스트 3건 추가. *동시 요청 시 1~2장 초과 가능성은 남아 있음 — 엄격히 막으려면 발급 수 컬럼 + 조건부 증가 필요.*
- [x] **중복 프로모 코드 생성 처리** (2026-09-21): 생성 전 `code` 중복을 확인해 500 대신 "이미 사용 중인 프로모 코드입니다" 400 반환.
- [x] **활성 토글** (2026-09-21): `PATCH /coupons/:couponId/active` 추가(ADMIN 전용)하고 목록 카드에 활성화/비활성화 버튼 연결. 비활성 쿠폰은 발급 버튼이 막힌다.

---

## 7. 참고 파일

| 목적 | 경로 |
|---|---|
| 쿠폰 API 컨트롤러 | `apps/backend/src/modules/coupons/coupons.controller.ts` |
| 쿠폰 서비스(검증 로직) | `apps/backend/src/modules/coupons/coupons.service.ts` |
| 쿠폰 DTO | `apps/backend/src/modules/coupons/dto/coupon.dto.ts` |
| 쿠폰 스키마 | `apps/backend/prisma/schema.prisma` (`Coupon`, `UserCoupon`, `CouponType`) |
| 가장 가까운 화면 선례 | `apps/admin/src/app/(dashboard)/banners/page.tsx` |
| 에러 배너 패턴 선례 | `apps/admin/src/app/(dashboard)/operations/page.tsx` |
| 사이드바 설정 | `apps/admin/src/lib/adminPermissions.ts` |
| 고객 쪽 쿠폰 사용 화면 | `apps/delivery-customer/src/app/mypage/coupons/` |
