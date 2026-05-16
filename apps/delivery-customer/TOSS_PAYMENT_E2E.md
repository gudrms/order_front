# Toss 결제 E2E 점검표

배달앱 Toss 카드 결제 성공/실패를 실제 브라우저에서 확인할 때 쓰는 실행 체크리스트다.

## 전제 조건

- `NEXT_PUBLIC_TOSS_CLIENT_KEY`는 결제위젯 테스트용 클라이언트 키(`test_gck_...`)를 사용한다.
- 백엔드 `TOSS_PAYMENTS_SECRET_KEY`는 같은 상점의 결제위젯 테스트용 시크릿 키(`test_gsk_...`)를 사용한다.
- Toss 콘솔의 API 개별 연동 키(`test_ck_...`/`test_sk_...`)는 기존 결제창·자동결제·정산지급대행용이므로 결제위젯 E2E에 사용하지 않는다.
- `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`가 배달앱 실행 환경에 잡혀 있다.
- 카카오 로그인 또는 Supabase OAuth 로그인 후 `/auth/sync`가 성공해 앱 DB `User`가 생성되어야 한다.
- 테스트 환경의 결제 승인은 가상 승인이라 실제 결제수단에서 출금되지 않는다.
- 운영 테스트 매장 `테스트 매장 (이미지 업로드)`은 배달 주문 접수 ON, 최소 주문금액 0원, 배달비 0원으로 설정한다.
- 결제 진입 확인용 메뉴 `E2E 테스트 타코`는 10원으로 설정한다.
- 장바구니 최소주문금액 검증은 매장별 `minimumOrderAmount`를 따라야 한다. 10원 테스트가 장바구니에서 막히면 `delivery-customer` 최신 배포 여부를 먼저 확인한다.

## 성공 시나리오

1. 배달앱에서 로그인한다.
2. 테스트 매장을 선택하고 `E2E 테스트 타코` 1개를 장바구니에 담는다.
3. 배달 주소, 주문자명, 연락처를 입력한다.
4. 체크아웃에서 토스페이먼츠 카드 결제 위젯이 표시되는지 확인한다.
5. 결제하기를 누르면 백엔드에 `PENDING_PAYMENT` 주문과 `READY` 결제 시도가 생성되는지 확인한다.
6. Toss 결제창에서 테스트 카드 결제를 완료한다.
7. `/store/{storeId}/order/success`로 돌아온 뒤 `POST /payments/toss/confirm`이 호출되는지 확인한다.
8. 주문 상태가 `PAID`, 결제 상태가 `PAID`로 바뀌는지 확인한다.
9. 주문 상세 화면에서 주문번호, 주문 내역, 배달 정보, 상태 트래커가 표시되는지 확인한다.

## 실패/취소 시나리오

1. 체크아웃에서 결제하기를 누른다.
2. Toss 결제창에서 결제를 취소하거나 실패 케이스를 만든다.
3. `/store/{storeId}/order/fail`로 돌아온 뒤 `POST /payments/toss/fail`이 호출되는지 확인한다.
4. 주문 상태가 `CANCELLED`, 결제 상태가 `FAILED`로 바뀌는지 확인한다.
5. 실패 화면에서 `다시 결제하기` 버튼으로 체크아웃에 복귀되는지 확인한다.

## 확인할 로그

- 브라우저 Network: `/orders`, `/payments/toss/confirm`, `/payments/toss/fail`
- 백엔드 로그: Toss confirm/fail 요청과 에러 응답, `/payments/toss/webhook` 수신 여부
- DB: `Order.status`, `Order.paymentStatus`, `Payment.status`, `Payment.paymentKey`, `Payment.approvedAt`, `Payment.failedAt`

## Toss 콘솔 등록값

- 웹훅 이름: `Tacomolly Delivery Payments`
- 웹훅 URL: `https://api.tacomolly.kr/api/v1/payments/toss/webhook`
- 등록 이벤트:
  - `PAYMENT_STATUS_CHANGED`
  - `CANCEL_STATUS_CHANGED`
- 리다이렉트 URL:
  - `https://delivery.tacomolly.kr/store/*/order/success`
  - `https://delivery.tacomolly.kr/store/*/order/fail`

## 공식 문서 기준

- Toss Payments 테스트 환경에서는 실제 결제 정보로 테스트해도 결제가 가상 승인된다.
- `requestPayment()`에는 `orderId`, `successUrl`, `failUrl`을 설정해야 한다.
- 승인 이후 `paymentKey`는 DB에 저장해야 한다.
- 테스트 키와 라이브 키를 섞으면 `INVALID_API_KEY`가 날 수 있다.

참고:

- https://docs.tosspayments.com/guides/v2/get-started/environment
- https://docs.tosspayments.com/guides/v2/get-started/payment-flow
- https://docs.tosspayments.com/reference/using-api/api-keys
