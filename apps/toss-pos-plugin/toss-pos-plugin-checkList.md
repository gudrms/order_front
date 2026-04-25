# Toss SDK/POS 앱 체크리스트
마지막 업데이트: 2026-04-26

## 현재 요약

- 이 앱은 Toss SDK/POS 연동용이다.
- 결제 모듈은 백엔드 공통 `PaymentsModule`이 담당하고, 이 앱은 POS 주문 수신/등록/동기화 쪽에 집중한다.

## 완료

- [x] Vite 기반 플러그인 구조
- [x] Toss POS SDK 설치
- [x] Realtime/Polling 주문 수신 구조
- [x] 주문 등록 `order.add` 구조
- [x] catalog sync 구조
- [x] build/zip/test 구조
- [x] 백엔드에 Toss 결제 승인/실패 공통 API 존재
- [x] `okpos*`는 신규 개발 기준에서 제외하기로 결정

## 남은 일

- [ ] 새 주문 코어 기준 POS 전송 조건 확정
- [ ] `PENDING_PAYMENT` 주문은 POS 전송 제외
- [ ] `PAID` 또는 현장결제 `PENDING` 주문의 POS 전송 정책 확정
- [ ] 배달 메모/결제수단 POS 메모 매핑
- [ ] `Payment.status`와 `Order.status` 조합별 처리
- [ ] POS 전송 실패 재시도/idempotency 보강
- [ ] 실제 Toss POS 기기 E2E
- [ ] catalog sync와 관리자 메뉴 동기화 흐름 정리

## 다음 순서

1. POS로 보낼 주문 상태 조건 확정
2. pending orders API를 새 주문 도메인 기준으로 확장
3. Toss SDK/POS 앱 매핑 수정
4. 실제 기기 E2E
