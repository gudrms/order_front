# Taco Mono API 테스트 시나리오

## 개요

**Base URL**
- 로컬: `http://localhost:4000/api/v1`
- 운영: `https://api.tacomole.kr/api/v1`

**공통 응답 규격**

성공:
```json
{ "statusCode": 200, "data": { ... } }
```

에러:
```json
{ "statusCode": 400, "timestamp": "...", "path": "...", "message": "..." }
```

**인증**: `Authorization: Bearer <supabase_jwt>`

---

## 시나리오 1: 테이블오더 주문 플로우

고객이 QR로 테이블에 앉아서 첫 주문 → 추가 주문 → 계산 완료까지의 흐름.

### 전제 조건
- storeId: `<매장 UUID>`
- tableNumber: `5`

### Step 1-1: 메뉴 조회

카테고리 목록과 메뉴 목록을 조회한다.

```http
GET /api/v1/stores/{storeId}/categories
```
응답: `{ statusCode: 200, data: [{ id, name, displayOrder }] }`

```http
GET /api/v1/stores/{storeId}/menus
```
응답: `{ statusCode: 200, data: [{ id, name, price, optionGroups }] }`

### Step 1-2: 첫 주문 (세션 시작)

```http
POST /api/v1/stores/{storeId}/orders/first
Content-Type: application/json

{
  "tableNumber": 5,
  "items": [
    {
      "menuId": "<menu-id>",
      "quantity": 2,
      "options": [{ "optionId": "<option-id>" }]
    }
  ]
}
```
응답: `{ statusCode: 201, data: { session: { id, sessionNumber, status: "ACTIVE" }, order: { id, orderNumber, totalAmount } } }`

> 반환된 `session.id`를 저장해두세요.

### Step 1-3: 추가 주문

```http
POST /api/v1/stores/{storeId}/orders/{sessionId}
Content-Type: application/json

{
  "tableNumber": 5,
  "items": [
    { "menuId": "<menu-id>", "quantity": 1 }
  ]
}
```
응답: `{ statusCode: 201, data: { id, orderNumber, totalAmount } }`

### Step 1-4: 현재 세션 조회 (계산 전 확인)

```http
GET /api/v1/stores/{storeId}/tables/5/current-session
```
응답: `{ statusCode: 200, data: { id, totalAmount, orders: [...] } }`

### Step 1-5: 세션 종료 (계산)

```http
POST /api/v1/stores/{storeId}/sessions/{sessionId}/complete
Content-Type: application/json

{
  "guestCount": 2,
  "guestPhone": "010-1234-5678",
  "guestName": "홍길동",
  "paymentMethod": "CARD"
}
```
응답: `{ statusCode: 200, data: { id, status: "COMPLETED", totalAmount, guestCount, guest } }`

---

## 시나리오 2: 배달앱 주문 플로우 (Toss 결제)

고객이 배달앱에서 메뉴 선택 → 주문 생성(PENDING_PAYMENT) → Toss 결제창 → 결제 승인 → PAID 확정.

### 전제 조건
- 사용자 로그인 후 JWT 토큰 보유
- storeId: `<매장 UUID>`

### Step 2-1: 로그인 사용자 동기화

최초 로그인 또는 정보 변경 시:

```http
POST /api/v1/auth/sync
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "홍길동",
  "phoneNumber": "010-1234-5678"
}
```
응답: `{ statusCode: 201, data: { id, email, name } }`

### Step 2-2: 쿠폰 확인 (선택)

```http
GET /api/v1/users/me/coupons/available
Authorization: Bearer <jwt>
```
응답: `{ statusCode: 200, data: [{ id, coupon: { discountType, discountValue }, expiresAt }] }`

### Step 2-3: 배달 주문 생성

```http
POST /api/v1/orders
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "storeId": "<store-uuid>",
  "delivery": {
    "recipientName": "홍길동",
    "recipientPhone": "010-1234-5678",
    "address": "서울시 강남구 테헤란로 123",
    "detailAddress": "101동 1001호",
    "zipCode": "06234",
    "deliveryMemo": "문 앞에 두고 벨 눌러주세요."
  },
  "items": [
    {
      "menuId": "<menu-uuid>",
      "menuName": "비프 타코",
      "quantity": 2,
      "price": 9500,
      "options": []
    }
  ],
  "totalAmount": 24000,
  "payment": {
    "orderId": "ORDER_1777093200000_1234",
    "amount": 24000
  },
  "userCouponId": "<coupon-id 선택>"
}
```
응답: `{ statusCode: 201, data: { orderId, orderNumber, status: "PENDING_PAYMENT", payment: { orderId, amount } } }`

> `payment.orderId`로 Toss 결제창을 초기화합니다.

### Step 2-4: Toss 결제 승인 (결제창 완료 후)

Toss 결제창에서 성공 시 `paymentKey`, `orderId`, `amount`를 받아 백엔드로 전송:

```http
POST /api/v1/payments/toss/confirm
Content-Type: application/json

{
  "paymentKey": "tgen_20260425123456AbCdE",
  "orderId": "ORDER_1777093200000_1234",
  "amount": 24000
}
```
응답: `{ statusCode: 201, data: { orderId, status: "PAID", approvedAmount: 24000, approvedAt } }`

### Step 2-5: 결제 실패 처리 (결제창 취소/실패 시)

```http
POST /api/v1/payments/toss/fail
Content-Type: application/json

{
  "orderId": "ORDER_1777093200000_1234",
  "code": "PAY_PROCESS_CANCELED",
  "message": "사용자가 결제를 취소했습니다."
}
```
응답: `{ statusCode: 201, data: { orderId, status: "CANCELLED" } }`

### Step 2-6: 고객 주문 취소 (결제 승인 전)

```http
PATCH /api/v1/orders/{orderId}/cancel
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "reason": "단순 변심"
}
```
응답: `{ statusCode: 200, data: { orderId, status: "CANCELLED" } }`

---

## 시나리오 3: 관리자 주문 관리 플로우

매장 관리자(사장님)가 주문을 확인하고 상태를 변경하는 흐름.

### 전제 조건
- 관리자 JWT 토큰 보유
- storeId: `<매장 UUID>`

### Step 3-1: 내 매장 목록 조회

```http
GET /api/v1/stores/me
Authorization: Bearer <jwt>
```
응답: `{ statusCode: 200, data: [{ id, name, storeType, branchId }] }`

### Step 3-2: 주문 목록 조회 (상태 필터)

```http
GET /api/v1/stores/{storeId}/orders?status=PENDING&page=1
Authorization: Bearer <jwt>
```
응답: `{ statusCode: 200, data: [{ id, orderNumber, tableNumber, status, totalAmount }] }`

### Step 3-3: 주문 상태 변경 (PENDING → CONFIRMED)

```http
PATCH /api/v1/stores/{storeId}/orders/{orderId}/status
Authorization: Bearer <jwt>
Content-Type: application/json

{ "status": "CONFIRMED" }
```
응답: `{ statusCode: 200, data: { id, status: "CONFIRMED", updatedAt } }`

### Step 3-4: 배달 상태 변경

```http
PATCH /api/v1/stores/{storeId}/orders/{orderId}/delivery-status
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "status": "DELIVERING",
  "riderMemo": "1시간 예상"
}
```
응답: `{ statusCode: 200, data: { id, deliveryStatus: "DELIVERING" } }`

### Step 3-5: 관리자 주문 취소/환불

```http
POST /api/v1/payments/orders/{orderId}/toss/cancel
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "cancelReason": "재고 소진으로 인한 취소",
  "cancelAmount": 24000
}
```
응답: `{ statusCode: 201, data: { canceledAmount: 24000, remainAmount: 0, status: "CANCELLED" } }`

---

## 시나리오 4: POS 플러그인 연동 플로우

POS 플러그인이 백엔드와 통신하는 흐름. `x-pos-api-key` 헤더 필수.

### Step 4-1: 대기 주문 Polling

```http
GET /api/v1/pos/orders/pending
x-pos-api-key: <pos-api-key>
```
응답: `{ statusCode: 200, data: [{ id, orderNumber, totalAmount, items, payment }] }`

> 주기적으로 폴링하여 새 주문을 POS에 등록합니다.

### Step 4-2: POS 등록 성공 후 상태 업데이트

```http
PATCH /api/v1/pos/orders/{orderId}/status
x-pos-api-key: <pos-api-key>
Idempotency-Key: order-{orderId}-CONFIRMED
Content-Type: application/json

{
  "status": "CONFIRMED",
  "tossOrderId": "toss-order-456"
}
```
응답: `{ statusCode: 200, data: { id, status: "CONFIRMED", tossOrderId } }`

### Step 4-3: POS 등록 실패 기록

```http
PATCH /api/v1/pos/orders/{orderId}/sync-failed
x-pos-api-key: <pos-api-key>
Content-Type: application/json

{ "message": "POS network timeout" }
```
응답: `{ statusCode: 200, data: { id, posSyncStatus: "FAILED", posSyncAttemptCount: 2 } }`

---

## 시나리오 5: 메뉴 관리 플로우

관리자가 메뉴를 생성/수정하는 흐름.

### Step 5-1: 카테고리 생성

```http
POST /api/v1/stores/{storeId}/categories
Authorization: Bearer <jwt>
Content-Type: application/json

{ "name": "타코류", "displayOrder": 1 }
```
응답: `{ statusCode: 201, data: { id, name, displayOrder } }`

### Step 5-2: 메뉴 생성

```http
POST /api/v1/stores/{storeId}/menus
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "categoryId": "<category-uuid>",
  "name": "비프 타코",
  "price": 9500,
  "description": "부드러운 소고기와 신선한 채소",
  "imageUrl": "https://cdn.tacomole.kr/menus/beef-taco.jpg"
}
```
응답: `{ statusCode: 201, data: { id, name, price, categoryId } }`

### Step 5-3: 옵션 그룹 생성

```http
POST /api/v1/stores/{storeId}/menus/{menuId}/option-groups
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "맵기 선택",
  "isRequired": true,
  "minSelect": 1,
  "maxSelect": 1
}
```
응답: `{ statusCode: 201, data: { id, name, isRequired } }`

### Step 5-4: 옵션 항목 추가

```http
POST /api/v1/stores/{storeId}/menus/{menuId}/option-groups/{groupId}/options
Authorization: Bearer <jwt>
Content-Type: application/json

{ "name": "순한맛", "price": 0 }
```
응답: `{ statusCode: 201, data: { id, name, price } }`

---

## 시나리오 6: 쿠폰 발급 플로우

관리자가 쿠폰을 만들고 사용자에게 발급하는 흐름.

### Step 6-1: 쿠폰 템플릿 생성 (관리자)

```http
POST /api/v1/coupons
Authorization: Bearer <jwt>
Content-Type: application/json

{
  "name": "신규 가입 혜택",
  "discountType": "FIXED",
  "discountValue": 3000,
  "minOrderAmount": 15000,
  "expiresAt": "2025-12-31T23:59:59.000Z"
}
```
응답: `{ statusCode: 201, data: { id, name, discountType, discountValue, code } }`

### Step 6-2: 사용자에게 발급 (관리자)

```http
POST /api/v1/coupons/{couponId}/issue
Authorization: Bearer <jwt>
Content-Type: application/json

{ "userId": "<user-uuid>" }
```
응답: `{ statusCode: 201, data: { id, userId, couponId, expiresAt } }`

### Step 6-3: 프로모 코드로 쿠폰 등록 (사용자)

```http
POST /api/v1/users/me/coupons/redeem
Authorization: Bearer <jwt>
Content-Type: application/json

{ "code": "TACO2024" }
```
응답: `{ statusCode: 201, data: { id, coupon: { name, discountValue }, expiresAt } }`

---

## 에러 코드 참고

| statusCode | 상황 |
|------------|------|
| 400 | 요청 파라미터 유효성 오류, 금액 불일치, 상태 전이 불가 |
| 401 | JWT 토큰 없음 또는 만료 |
| 403 | 권한 없음 (타인 매장 접근 등) |
| 404 | 대상 리소스를 찾을 수 없음 |
| 409 | 중복 충돌 (이미 존재하는 리소스, tossOrderId 충돌 등) |
| 500 | 서버 내부 오류 |

## 자주 쓰는 테스트 데이터

```
# 타코몰리 김포점
storeType: tacomolly
branchId: gimpo
URL: GET /api/v1/stores/identifier/tacomolly/gimpo

# 테스트 테이블
tableNumber: 1 ~ 10

# 테스트 결제 (Toss 개발 환경)
paymentKey: tgen_20260425123456AbCdE (테스트키)
```
