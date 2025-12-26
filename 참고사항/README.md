# 🍽️ Table Order System (테이블 오더 프로그램)

## 📋 프로젝트 개요
테이블에 비치된 태블릿을 통해 고객이 직접 메뉴를 확인하고 주문할 수 있는 시스템입니다.
주문 누락을 방지하고, 홀 직원의 업무 효율을 높이며, 고객에게 편리한 주문 경험을 제공합니다.

## 🔗 외부 연동 (Integrations)
- **OKPOS POS 시스템**: 실시간 주문 전송 및 메뉴 동기화
  - API Base URL: `https://dum.okpos.co.kr/api`
  - 연동 문서: [okpos.md](./okpos.md)
  - 주요 기능: 주문 생성, 메뉴 조회, 주문 상태 추적

## 🎯 주요 기능 (Features)

### 1. 고객용 (테이블 태블릿)
- **메뉴판 조회**: 카테고리별 메뉴 확인, 메뉴 이미지 및 상세 설명, 품절 상태 표시
- **장바구니**: 주문 전 선택한 메뉴 확인 및 수량 조절
- **주문하기**: 주방으로 주문 전송 (실시간)
- **직원 호출**: 물, 티슈, 수저 등 간단한 요청 사항 전송
- **주문 내역 확인**: 현재 테이블의 총 주문 내역 및 합계 금액 확인

### 2. 관리자용 (주방/카운터)
- **실시간 주문 접수**: 신규 주문 알림 (소리 + 화면)
- **주문 상태 관리**: 조리 중 → 서빙 완료 상태 변경
- **메뉴 관리**: 품절 처리, 메뉴 추가/수정/삭제, 가격 변경
- **테이블 현황**: 각 테이블의 주문/결제 상태 한눈에 확인
- **매출 통계**: 일/주/월별 매출, 인기 메뉴 분석

---

## 📊 데이터베이스 스키마 (ERD)

### 1. Stores (매장)
- `id` (PK): UUID
- `name`: 매장명
- `address`: 주소
- `phone`: 전화번호
- `okpos_store_id`: OKPOS 매장 ID (연동용)
- `business_hours`: 영업시간 (JSONB)
- `holiday_info`: 정기 휴무일 (JSONB)
- `created_at`: 생성일시
- `updated_at`: 수정일시
- `deleted_at`: 삭제일시 (Soft Delete)

### 2. Tables (테이블)
- `id` (PK): UUID
- `store_id` (FK): 매장 ID
- `table_number`: 테이블 번호 (1, 2, 3...)
- `qr_code`: QR 접속 코드
- `status`: 상태 (AVAILABLE, OCCUPIED, RESERVED)
- `seats`: 수용 인원
- `floor`: 층수
- `position`: 좌표 정보 (JSONB, 매장 레이아웃용)
- `created_at`: 생성일시
- `updated_at`: 수정일시
- `deleted_at`: 삭제일시

### 3. Categories (카테고리)
- `id` (PK): UUID
- `store_id` (FK): 매장 ID
- `name`: 카테고리명 (메인, 사이드, 음료 등)
- `sort_order`: 정렬 순서
- `created_at`: 생성일시
- `updated_at`: 수정일시
- `deleted_at`: 삭제일시

### 4. Menus (메뉴)
- `id` (PK): UUID
- `category_id` (FK): 카테고리 ID
- `name`: 메뉴명
- `description`: 상세 설명
- `price`: 가격
- `image_url`: 이미지 경로
- `is_sold_out`: 품절 여부 (Boolean)
- `is_visible`: 노출 여부 (Boolean)
- `okpos_menu_id`: OKPOS 메뉴 ID (연동용)
- `sort_order`: 정렬 순서
- `created_at`: 생성일시
- `updated_at`: 수정일시
- `deleted_at`: 삭제일시

### 5. Options (옵션)
- `id` (PK): UUID
- `menu_id` (FK): 메뉴 ID
- `name`: 옵션명 (맵기, 토핑 등)
- `price`: 추가 가격
- `created_at`: 생성일시
- `updated_at`: 수정일시
- `deleted_at`: 삭제일시

### 6. Orders (주문)
- `id` (PK): UUID
- `table_id` (FK): 테이블 ID
- `status`: 주문 상태 (PENDING, COOKING, SERVED, COMPLETED, CANCELLED)
- `total_price`: 총 결제 금액
- `customer_count`: 인원 수
- `okpos_order_id`: OKPOS 주문 ID (연동용)
- `okpos_sync_status`: OKPOS 동기화 상태 (PENDING, SUCCESS, FAILED)
- `created_at`: 주문 일시
- `updated_at`: 수정일시
- `deleted_at`: 삭제일시

### 7. OrderItems (주문 상세)
- `id` (PK): UUID
- `order_id` (FK): 주문 ID
- `menu_id` (FK): 메뉴 ID
- `menu_name`: 메뉴명 (Snapshot)
- `menu_price`: 가격 (Snapshot)
- `quantity`: 수량
- `created_at`: 생성일시
- `updated_at`: 수정일시

### 8. OrderItemOptions (주문 옵션 상세) ⭐ 신규
- `id` (PK): UUID
- `order_item_id` (FK): 주문 상세 ID
- `option_id` (FK): 옵션 ID
- `option_name`: 옵션명 (Snapshot)
- `option_price`: 옵션 가격 (Snapshot)
- `created_at`: 생성일시

### 9. Payments (결제 정보) ⭐ 신규
- `id` (PK): UUID
- `order_id` (FK): 주문 ID
- `payment_method`: 결제 수단 (CARD, CASH, QR, OKPOS)
- `amount`: 결제 금액
- `status`: 결제 상태 (PENDING, COMPLETED, FAILED, REFUNDED)
- `okpos_payment_id`: OKPOS 결제 ID (연동용)
- `paid_at`: 결제 완료 일시
- `created_at`: 생성일시
- `updated_at`: 수정일시

### 10. StaffCalls (직원 호출) ⭐ 신규
- `id` (PK): UUID
- `table_id` (FK): 테이블 ID
- `call_type`: 호출 유형 (WATER, SPOON, TISSUE, ETC)
- `message`: 요청 메시지 (선택사항)
- `status`: 처리 상태 (PENDING, RESOLVED)
- `created_at`: 호출 일시
- `resolved_at`: 처리 완료 일시

### 11. OrderCancellations (주문 취소 이력) ⭐ 신규
- `id` (PK): UUID
- `order_id` (FK): 주문 ID
- `order_item_id` (FK): 주문 상세 ID (부분 취소 시, nullable)
- `cancelled_by`: 취소자 (USER, ADMIN)
- `reason`: 취소 사유
- `created_at`: 취소 일시

### 12. OKPOS 연동 테이블

#### 12-1. okpos_sync_log (연동 로그)
- `id` (PK): UUID
- `sync_type`: 동기화 유형 (MENU, ORDER, PAYMENT)
- `entity_id`: 연관 엔티티 ID (주문 ID 등)
- `request_data`: 요청 데이터 (JSONB)
- `response_data`: 응답 데이터 (JSONB)
- `status`: 상태 (SUCCESS, FAILED)
- `error_message`: 에러 메시지
- `created_at`: 생성일시

#### 12-2. failed_okpos_orders (실패한 주문 큐)
- `id` (PK): UUID
- `order_id` (FK): 주문 ID
- `request_json`: 요청 데이터 (TEXT)
- `error_message`: 에러 메시지
- `retry_count`: 재시도 횟수
- `last_retry_at`: 마지막 재시도 일시
- `created_at`: 생성일시

---

## 🔄 데이터베이스 주요 개선 사항

### ✅ 정규화 개선
- **OrderItemOptions 테이블 신규 추가**: 주문 옵션을 JSON → 관계형 테이블로 변경하여 통계 분석 가능

### ✅ 추적성 향상
- **모든 테이블에 Timestamp 추가**: created_at, updated_at, deleted_at (Soft Delete)
- **OrderCancellations 테이블**: 주문 취소 이력 추적
- **StaffCalls 테이블**: 직원 호출 이력 관리

### ✅ OKPOS 연동 강화
- **매핑 컬럼 추가**: stores.okpos_store_id, menus.okpos_menu_id, orders.okpos_order_id
- **동기화 상태 추적**: orders.okpos_sync_status
- **연동 로그**: okpos_sync_log 테이블로 모든 API 호출 기록

### ✅ 결제 정보 분리
- **Payments 테이블 신규 추가**: 결제 수단, 상태, OKPOS 결제 ID 등 상세 관리
- **다양한 결제 수단 지원**: 카드, 현금, QR, OKPOS 결제

### ✅ 운영 편의성
- **Soft Delete**: deleted_at 컬럼으로 실수 삭제 시 복구 가능
- **테이블 관리 강화**: 수용 인원(seats), 층수(floor), 위치 정보(position)
- **부분 취소 지원**: OrderCancellations 테이블로 특정 메뉴만 취소 가능

---

## ✅ 요구사항 명세 (Requirements)

### 기능적 요구사항
1. **주문 시스템**: 고객은 태블릿을 통해 메뉴를 담고 주문할 수 있어야 한다.
2. **실시간 알림**: 주문 발생 시 주방/카운터에 1초 이내에 알림이 전달되어야 한다. (WebSocket)
3. **메뉴 관리**: 관리자는 메뉴의 품절 상태를 즉시 반영할 수 있어야 한다.
4. **주문 현황**: 관리자는 테이블별 주문 상태를 한눈에 파악할 수 있어야 한다.
5. **OKPOS 연동**: 주문 생성 시 OKPOS POS 시스템으로 실시간 전송되어야 한다.
6. **직원 호출**: 고객이 물, 티슈 등을 요청할 수 있고, 관리자가 확인할 수 있어야 한다.

### 비기능적 요구사항
1. **반응 속도**: 메뉴 터치 및 화면 전환은 지연 없이 즉각적이어야 한다.
2. **안정성**: 네트워크 불안정 상황에서도 주문 데이터가 유실되지 않아야 한다.
3. **확장성**: 추후 결제 모듈(PG) 연동이 용이한 구조여야 한다.
4. **복구 가능성**: Soft Delete로 실수로 삭제된 데이터를 복구할 수 있어야 한다.
5. **추적성**: 모든 주문, 결제, 취소 이력이 추적 가능해야 한다.

---

## 📁 프로젝트 문서

- **[API 명세서](./api_spec.md)**: REST API 엔드포인트 및 Request/Response 형식
- **[기술 스펙](./tech_spec.md)**: 기술 스택, 인프라, 배포 방식
- **[OKPOS 연동 가이드](./okpos.md)**: OKPOS API 연동 상세 구현 방법

---

> **Note**: 이 문서는 기획 초안입니다. 추가하고 싶은 기능이나 변경 사항이 있다면 자유롭게 수정해주세요.
