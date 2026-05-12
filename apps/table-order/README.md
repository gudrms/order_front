# Table Order App

매장 테이블에서 QR로 진입해 메뉴를 보고 주문하는 고객용 Next.js 앱입니다.

## 실행

```bash
pnpm --filter table-order dev
```

로컬 주소: `http://localhost:3000`
운영 주소: `https://order.tacomole.kr`

## 주요 역할

- QR 기반 매장/테이블 진입
- 메뉴와 카테고리 조회
- 메뉴 옵션 선택
- 장바구니 관리
- 첫 주문/추가 주문 생성
- 주문 내역 확인
- 직원 호출

## 구조

| 경로 | 역할 |
|---|---|
| `src/app` | Next.js App Router |
| `src/features` | 메뉴/장바구니/주문 feature |
| `src/hooks` | React Query hook |
| `src/lib` | API 조합, query client, Supabase, 유틸 |
| `src/stores` | UI/table/error 클라이언트 상태 |
| `src/types` | 로컬 중복 타입 없음, 공통 타입 안내 |

상세 구조는 `src/*/README.md`를 기준으로 봅니다.

## 패키지 사용 기준

- 공통 API/타입: `@order/shared`
- 주문 계산/장바구니: `@order/order-core`
- 공통 UI: `@order/ui`

## 확인

```bash
pnpm --filter table-order build
pnpm --filter table-order test
```

## 문서

- [테이블오더 내부 구조](src/features/README.md)
- [테스트 시나리오](../../docs/test-scenarios)
- [배포 가이드](../../docs/deployment.md)
