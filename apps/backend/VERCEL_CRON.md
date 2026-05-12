# Backend Cron / Cold Start

## Current Status

Vercel Cron is not active for this project. Backend warm-up and background jobs are currently handled by GitHub Actions.

Workflow file:

```text
.github/workflows/backend-cron.yml
```

Schedule:

```yaml
cron: '*/5 * * * *'
```

## Required GitHub Actions Secrets

Configure these in `GitHub repository -> Settings -> Secrets and variables -> Actions`.

```text
API_BASE_URL=https://api.tacomole.kr/api/v1
INTERNAL_JOB_SECRET=<same value as backend INTERNAL_JOB_SECRET>
```

`API_BASE_URL` must include `/api/v1`.

## Cron Jobs

The workflow runs these requests:

```text
GET  ${API_BASE_URL}/health
POST ${API_BASE_URL}/queue/process-once
POST ${API_BASE_URL}/payments/toss/expire-pending
POST ${API_BASE_URL}/payments/toss/reconcile
```

Each request uses `curl --fail-with-body`, so 4xx/5xx responses fail the GitHub Actions run.

## How To Verify

1. Open the GitHub repository.
2. Go to `Actions`.
3. Select `Backend Cron Jobs`.
4. Check that scheduled runs are created roughly every 5 minutes.
5. Click `Run workflow` to trigger a manual run.
6. Confirm all steps are green:

```text
Validate cron secrets
Health check
Process Queue (MQ Consumer)
Expire Pending Toss Payments
Reconcile Toss Payments
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
