# Admin App

점주/운영자가 매장, 메뉴, 주문, 알림, 운영 상태를 관리하는 Next.js 앱입니다.

## 실행

```bash
pnpm --filter admin dev
```

로컬 주소: `http://localhost:3003`

## 주요 역할

- 관리자 로그인
- 매장 생성/수정
- 메뉴/카테고리/옵션 관리
- 주문 접수와 상태 변경
- QR 테이블 관리
- 직원 호출 확인
- 운영/큐/알림 상태 확인

## 주요 경로

| 경로 | 역할 |
|---|---|
| `/login` | 관리자 로그인 |
| `/stores` | 매장 목록/선택 |
| `/menus` | 메뉴 관리 |
| `/orders` | 주문 관리 |
| `/tables` | 테이블/QR 관리 |
| `/calls` | 직원 호출 |
| `/operations` | 운영 상태와 실패 작업 확인 |

## 문서

- [관리자 E2E](ADMIN_E2E.md)
- [운영자 인수인계](../../docs/operator-handoff.md)
- [테스트 시나리오](../../docs/test-scenarios)
- [배포 가이드](../../docs/deployment.md)
