# Vercel Cron Jobs 설정

## 현재 상태
Vercel Hobby 플랜에서는 일일 1회만 cron job 실행 가능하므로 비활성화됨.

## Pro 플랜으로 업그레이드 시 추가할 설정

`vercel.json` 파일에 다음을 추가:

```json
{
    "version": 2,
    "builds": [
        {
            "src": "src/main.ts",
            "use": "@vercel/node"
        }
    ],
    "routes": [
        {
            "src": "/(.*)",
            "dest": "src/main.ts",
            "methods": [
                "GET",
                "POST",
                "PUT",
                "PATCH",
                "DELETE",
                "OPTIONS"
            ]
        }
    ],
    "crons": [
        {
            "path": "/api/v1/health",
            "schedule": "*/10 * * * *"
        }
    ]
}
```

## Cron 스케줄 설명
- `*/10 * * * *`: 10분마다 실행
- `/api/v1/health` 엔드포인트 호출하여 서버 활성 상태 유지

## 참고
- Vercel Pro 플랜: https://vercel.com/pricing
- Cron Jobs 문서: https://vercel.com/docs/cron-jobs
