# DineOS 개발 체크리스트

## 🚀 서버리스 최적화 (우선순위: 중)

### 1. Cold Start 방지
- [ ] `apps/backend/vercel.json`에 Cron Job 설정 (5분마다 Health Check)
- [ ] Health Check API 엔드포인트 구현 (`/api/health`)

### 2. Prisma Connection Pool 최적화
- [ ] DATABASE_URL에 connection pool 파라미터 추가
- [ ] `prisma.service.ts`에 pool 설정 최적화

### 3. 모니터링
- [ ] Vercel Analytics 활성화
- [ ] Cold Start 빈도 측정
- [ ] 피크 타임 응답 시간 모니터링

## 📊 서버 전환 고려 시점 (체크포인트)

다음 3가지 중 2개 이상 해당 시 전통 서버 검토:
- [ ] 매장 50개 이상 확장
- [ ] Cold Start가 비즈니스에 크리티컬한 문제 발생
- [ ] 월 비용 30만원 이상 지출 가능