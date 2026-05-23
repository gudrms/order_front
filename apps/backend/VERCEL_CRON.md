# Backend Cron / Cold Start

## Current Status

Vercel Cron is not active for this project. Backend warm-up and background jobs are handled by Upstash QStash.

Primary schedule:

```text
POST https://api.tacomole.kr/api/v1/cron/batch
```

Schedule:

```text
CRON_TZ=Asia/Seoul */5 10-23 * * *
```

This runs every 5 minutes from 10:00 through 23:55 KST.

## Required Secret

```text
INTERNAL_JOB_SECRET=<backend INTERNAL_JOB_SECRET>
```

In the QStash console, forward it with this header:

```text
Upstash-Forward-x-internal-job-secret: <backend INTERNAL_JOB_SECRET>
```

## Cron Jobs

The unified batch endpoint runs these steps:

```text
SELECT 1
MenusService.getMenus(storeId) for active stores
QueueConsumerService.processOnce({ quantity: 3 })
PaymentsService.expirePendingTossPayments({})
PaymentsService.reconcileTossPayments({})
```

## How To Verify

1. Open Upstash Console.
2. Go to `QStash -> Schedules`.
3. Confirm the `/cron/batch` schedule is active.
4. Go to `QStash -> Logs`.
5. Confirm recent runs return 2xx responses.

Manual smoke test:

```bash
curl -X POST https://api.tacomole.kr/api/v1/cron/batch \
  -H "x-internal-job-secret: ${INTERNAL_JOB_SECRET}" \
  -H "Content-Type: application/json" \
  -d "{}"
```

## Health Check URL

Use the backend domain:

```text
https://api.tacomole.kr/api/v1/health
```

Do not use the admin frontend domain for backend health checks:

```text
https://admin.tacomole.kr/health
```

The admin app is a Next.js frontend and does not provide `/health`.

## Additional Options

- Add an external uptime monitor, such as UptimeRobot or Better Stack, against `https://api.tacomole.kr/api/v1/health`.
- If the Vercel plan supports Cron Jobs, move simple warm-up pings to Vercel Cron.
- Keep queue and payment maintenance jobs protected by `INTERNAL_JOB_SECRET`.
- Keep `.github/workflows/backend-cron.yml` only as a legacy/manual fail-safe if needed.

## Vercel Cron Example

If moving to Vercel Cron later, add a `crons` section to `apps/backend/vercel.json`.

```json
{
  "crons": [
    {
      "path": "/api/v1/health",
      "schedule": "*/10 * * * *"
    }
  ]
}
```
