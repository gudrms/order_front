# 홈페이지 체크리스트
마지막 업데이트: 2026-05-02 (정책 전환 — 홈페이지 직접 주문 폐기, 배달앱 리다이렉트로 단일화)

## 현재 요약

- 브랜드 홈페이지는 마케팅/SEO(SSG) 역할에 집중한다.
- 주문 진입은 배달앱(`delivery-customer`)으로 리다이렉트하여 결제·주소·푸시 등 핵심 플로우의 SSOT를 단일화한다.
- 홈페이지 직접 주문(`HOMEPAGE` source) 화면은 폐기하고, 백엔드 공개 주문 API/`HOMEPAGE` enum도 사용 중단한다(코드/스키마는 추후 정리).
- 모바일 환경에서는 앱 딥링크(`taco://`) 시도 후 웹 fallback(`delivery-customer` URL)로 자연스러운 PWA/네이티브 진입을 유도한다.

## 완료

- [x] 브랜드 메인 페이지
- [x] 메뉴 소개 페이지
- [x] 매장 안내 페이지
- [x] 창업 문의 페이지
- [x] Navbar/Footer
- [x] SEO 기본 파일
- [x] 창업 문의 server action 구조
- [x] 매장/메뉴 페이지를 실제 백엔드 API 조회로 전환
- [x] 매장별 배달 가능 여부, 최소 주문 금액, 배달비 표시

## 정책 전환 완료 (2026-05-02)

- [x] Hero/매장 카드 CTA를 `OrderCTAButton`(배달앱 URL 리다이렉트)으로 교체
- [x] 모바일 UA 감지 시 `taco://` 딥링크 시도 후 1.5s 내 응답 없으면 `NEXT_PUBLIC_DELIVERY_URL`로 fallback
- [x] `/order`, `/order/success`, `/order/fail` 라우트 및 `OrderContent` 제거
- [x] 백엔드 `POST /orders/homepage` 엔드포인트 제거
- [x] `CreateDeliveryOrderDto.source` 필드 및 HOMEPAGE 검증 분기 제거
- [x] `OrdersService.createDeliveryOrder`에서 HOMEPAGE 게스트 주문 분기 제거 (모든 배달 주문 인증 필수)
- [x] 백엔드 `tsc --noEmit` / `vitest orders.service` 21 tests 통과
- [x] brand-website `next build` 성공 (라우트 10개, /order 제거 확인)

## 남은 일 — 기존 미해결

- [x] Kakao Map 실제 연동/운영 키 환경변수 정리 (2026-05-06): `NEXT_PUBLIC_KAKAO_MAP_KEY` 기준으로 연동되어 있고, 로컬 등록 키는 운영용으로 확인. 배포 후 지도 렌더링 검증만 별도 필요.
- [x] 창업 문의 저장/관리자 연결 (2026-05-06): 백엔드 `FranchiseInquiry` 저장 API와 관리자 전용 조회/상태/메모 화면 연결.
- [ ] 결제 콜백/리다이렉트 URL 환경변수에서 brand-website 경로 정리 (운영 배포 직전 점검)
- [ ] DB schema의 `OrderSource` enum에서 `HOMEPAGE` 값 정리 (마이그레이션 영향 검토 후 별도 작업)

## 다음 순서

1. Kakao Map 배포 후 지도 렌더링 검증
2. `OrderSource` enum 정리 마이그레이션 영향 평가

## 최신 동기화 (2026-05-02)

- [x] 정책 결정 및 전환 작업 완료: 홈페이지 직접 주문 폐기, 배달앱 리다이렉트로 단일화

## 최신 동기화 (2026-05-03) — 런칭 준비도 감사

- [x] **상태**: 4개 앱 중 가장 안정적. SSG 마케팅 사이트 역할에 충실하고 결제·주소·푸시 같은 위험 표면이 없음
- [x] **결함 없음**: TODO/FIXME/console.log 0건. 자동화 테스트는 0건이나 SSG 특성상 위험도 낮음
- [x] **운영 키 등록 확인**: `NEXT_PUBLIC_KAKAO_MAP_KEY` 로컬 등록 값은 운영용. `.env.example`은 비밀값을 싣지 않기 위해 빈 값 유지.
- [ ] 배포 후 매장 지도 동작 검증
- [x] 창업 문의 데이터를 관리자에서 볼 수 있게 연결 (2026-05-06): 저장 API/DB 모델/관리자 조회 화면 연결 완료.
