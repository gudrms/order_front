# Backend API

주문, 결제, 매장, 메뉴, 알림, 큐 처리를 담당하는 NestJS API 서버입니다.

## 실행

```bash
pnpm --filter backend dev
```

로컬 주소: `http://localhost:4000`
운영 주소: `https://api.tacomole.kr/api/v1`
API 문서: `https://api.tacomole.kr/api/docs`

## 주요 역할

- Supabase PostgreSQL + Prisma 기반 데이터 처리
- 관리자/고객 API 제공
- Toss Payments 승인/정산/만료 처리
- Toss POS 연동과 실패 복구
- pgmq 기반 큐 처리
- FCM 알림 발송
- Sentry/로그 수집
- Health check와 운영 배치 엔드포인트 제공

## 주요 운영 엔드포인트

| Method | Path | 역할 |
|---|---|---|
| `GET` | `/api/v1/health` | 헬스체크 |
| `POST` | `/api/v1/queue/process-once` | 큐 1회 처리 |
| `POST` | `/api/v1/payments/toss/expire-pending` | 오래된 미승인 결제 정리 |
| `POST` | `/api/v1/payments/toss/reconcile` | Toss/로컬 DB 결제 상태 보정 |

운영 배치 엔드포인트는 `x-internal-job-secret` 헤더가 필요합니다.

## 확인

```bash
pnpm --filter backend build
pnpm --filter backend test
pnpm --filter backend prisma:generate
```

## 문서

- [Vercel Cron](VERCEL_CRON.md)
- [MQ 기술 스펙](MQ_TECH_SPEC.md)
- [운영자 인수인계](../../docs/operator-handoff.md)
- [배포 가이드](../../docs/deployment.md)
