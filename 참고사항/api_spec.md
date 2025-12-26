# 📡 API Specification (RESTful)

## 1. Common Response Format
```json
{
  "success": true,
  "data": { ... },
  "error": null
}
```

## 2. API Endpoints

### 🏪 Store & Table (매장/테이블)
| Method | URI | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/stores/{storeId}` | 매장 정보 조회 | - |
| `GET` | `/api/v1/tables/{tableId}` | 테이블 상태 조회 | - |
| `POST` | `/api/v1/tables/{tableId}/enter` | 테이블 착석 (QR스캔) | - |

### 🍽️ Menu (메뉴)
| Method | URI | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/stores/{storeId}/categories` | 전체 메뉴 목록 조회 | - |
| `GET` | `/api/v1/menus/{menuId}` | 메뉴 상세 조회 | - |

### 🛒 Order (주문)
| Method | URI | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/orders` | 주문 생성 (장바구니 전송) | `{ tableId, items: [{ menuId, quantity, options }] }` |
| `GET` | `/api/v1/orders/table/{tableId}` | 테이블 주문 내역 조회 | - |
| `POST` | `/api/v1/orders/{orderId}/cancel` | 주문 취소 요청 | - |

### 🔔 Staff Call (직원 호출)
| Method | URI | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/v1/calls` | 직원 호출 | `{ tableId, type: "WATER" | "SPOON" | "ETC" }` |

### 👨‍🍳 Admin / Kitchen (관리자)
| Method | URI | Description | Request Body |
| :--- | :--- | :--- | :--- |
| `GET` | `/api/v1/admin/orders` | 실시간 주문 접수 목록 | `?status=PENDING` |
| `PATCH` | `/api/v1/admin/orders/{orderId}/status` | 주문 상태 변경 | `{ status: "COOKING" | "SERVED" }` |
| `PATCH` | `/api/v1/admin/menus/{menuId}/soldout` | 메뉴 품절 처리 | `{ isSoldOut: true }` |

## 3. WebSocket (STOMP)
- **Endpoint**: `/ws-stomp`
- **Subscribe**:
    - `/topic/store/{storeId}/orders`: 신규 주문 알림 (주방용)
    - `/topic/table/{tableId}`: 내 주문 상태 변경 알림 (고객용)

## 4. External API Integration (OKPOS)

### 4.1 연동 개요
- **Base URL**: `https://dum.okpos.co.kr/api`
- **인증 방식**: API Key (Header: `X-API-KEY`)
- **상세 문서**: [okpos.md](./okpos.md)

### 4.2 주요 API 엔드포인트

| API | Purpose | Trigger Point |
|:----|:--------|:--------------|
| `POST /api/order/create` | OKPOS 주문 전송 | 고객 주문 완료 시 |
| `GET /api/menu/items` | 메뉴 동기화 | 매일 새벽 3시 (Scheduler) |
| `GET /api/order/{orderId}` | 주문 상태 조회 | 주문 상태 확인 시 |

### 4.3 주문 전송 Request/Response 예시

**Request:**
```json
{
  "storeId": "store-uuid",
  "tableNumber": "5",
  "items": [
    {
      "menuId": "menu-uuid",
      "menuName": "김치찌개",
      "quantity": 2,
      "price": 8000,
      "options": "{\"spicy\": \"medium\"}"
    }
  ],
  "totalPrice": 16000
}
```

**Response:**
```json
{
  "success": true,
  "okposOrderId": "OKPOS-202412-001",
  "status": "PENDING"
}
```

### 4.4 에러 처리
- **재시도**: Spring Retry 사용 (최대 3회, 2초 간격)
- **Circuit Breaker**: Resilience4j 적용
- **실패 주문**: `failed_okpos_orders` 테이블에 저장 후 스케줄러로 재시도
