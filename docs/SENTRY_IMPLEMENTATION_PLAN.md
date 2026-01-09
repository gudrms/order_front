# Sentry 로깅 시스템 구현 계획

## 📋 구현 체크리스트

### Phase 1: 사전 준비
- [x] Sentry 계정 생성 (https://sentry.io/signup/)
- [x] Organization 생성 (jhg-qn)
- [ ] 각 앱별 프로젝트 생성 (사용자가 직접 완료 필요)
  - [ ] table-order (Next.js)
  - [ ] admin (Next.js)
  - [ ] delivery-customer (Next.js)
  - [ ] brand-website (Next.js)
  - [ ] backend (Node.js/NestJS)
- [ ] 각 프로젝트의 DSN 키 복사

---

### Phase 2: 패키지 설치 ✅

#### 2.1 Frontend Apps (Next.js)
- [x] table-order에 Sentry 설치 ✅
- [x] admin에 Sentry 설치 ✅
- [x] delivery-customer에 Sentry 설치 ✅
- [x] brand-website에 Sentry 설치 ✅

#### 2.2 Backend (NestJS)
- [x] backend에 Sentry 설치 ✅

---

### Phase 3: 환경변수 설정 ✅

#### 3.1 로컬 환경변수
- [ ] `apps/table-order/.env.local` 생성 (사용자가 직접 DSN 키 입력 필요)
- [ ] `apps/admin/.env.local` 생성 (사용자가 직접 DSN 키 입력 필요)
- [ ] `apps/delivery-customer/.env.local` 생성 (사용자가 직접 DSN 키 입력 필요)
- [ ] `apps/brand-website/.env.local` 생성 (사용자가 직접 DSN 키 입력 필요)
- [ ] `apps/backend/.env` 업데이트 (사용자가 직접 DSN 키 입력 필요)

#### 3.2 .env.example 업데이트
- [x] 각 앱의 `.env.example`에 Sentry 변수 추가 ✅
- [ ] ENV_MANAGEMENT.md 문서 업데이트

#### 3.3 Vercel 환경변수
- [ ] table-order Vercel 프로젝트에 환경변수 추가
  - `NEXT_PUBLIC_SENTRY_DSN`
  - `SENTRY_AUTH_TOKEN`
  - `SENTRY_ORG`
  - `SENTRY_PROJECT`
- [ ] admin Vercel 프로젝트에 환경변수 추가
- [ ] delivery-customer Vercel 프로젝트에 환경변수 추가
- [ ] brand-website Vercel 프로젝트에 환경변수 추가
- [ ] backend Vercel 프로젝트에 환경변수 추가

---

### Phase 4: Frontend (Next.js) 설정 ✅

#### 4.1 table-order ✅
- [x] `sentry.client.config.ts` 생성 및 설정 ✅
- [x] `sentry.server.config.ts` 생성 및 설정 ✅
- [x] `sentry.edge.config.ts` 생성 및 설정 ✅
- [x] `next.config.ts`에 Sentry 플러그인 추가 ✅
- [x] `.gitignore`에 `.sentryclirc` 추가 ✅
- [x] 기존 ErrorStore와 통합 ✅
  - [x] addError에서 Sentry.captureException 호출 ✅
  - [x] 에러 컨텍스트 추가 (errorCode, source, meta) ✅

#### 4.2 admin ✅
- [x] Sentry 설정 파일 생성 ✅
- [x] next.config.ts 업데이트 ✅

#### 4.3 delivery-customer ✅
- [x] Sentry 설정 파일 생성 ✅
- [x] next.config.ts 업데이트 ✅
- [ ] Capacitor 네이티브 에러 캡처 설정 (향후 필요시)

#### 4.4 brand-website ✅
- [x] Sentry 설정 파일 생성 ✅
- [x] next.config.ts 업데이트 ✅

---

### Phase 5: Backend (NestJS) 설정 ✅

#### 5.1 Sentry 모듈 초기화 ✅
- [x] `main.ts`에 Sentry 초기화 추가 ✅
- [x] NestJS instrumentation 추가 (nodeProfilingIntegration) ✅

#### 5.2 Winston Transport 통합 ✅
- [x] `apps/backend/src/common/logger/sentry.transport.ts` 생성 ✅
  - [x] Winston Transport 클래스 구현 ✅
  - [x] ERROR 이상만 Sentry로 전송 ✅
  - [x] 기존 Supabase Transport와 병행 ✅
- [x] `winston.logger.ts`에 Sentry Transport 추가 ✅

#### 5.3 Global Exception Filter 통합
- [ ] `http-exception.filter.ts`에 Sentry 추가 (선택 사항)
  - Winston Logger가 이미 모든 에러를 Sentry로 전송하므로 중복 전송 방지

#### 5.4 컨텍스트 추가
- [x] 에러 컨텍스트 자동 추가 (errorCode, source, context) ✅
- [ ] User 정보 설정 (향후 JWT 인증 구현 시)
- [ ] Store 정보 추가 (향후 필요시)

---

### Phase 6: Sentry 기능 설정

#### 6.1 Source Maps
- [ ] Frontend: 빌드 시 자동 업로드 확인
- [ ] Backend: TypeScript 소스맵 업로드 설정

#### 6.2 Release Tracking
- [ ] package.json version을 Sentry release로 사용
- [ ] Git commit SHA 추가
- [ ] Deploy 시 release 생성

#### 6.3 Performance Monitoring
- [ ] Frontend: 페이지 로드 추적 (tracesSampleRate: 0.1)
- [ ] Backend: API 엔드포인트 추적 (tracesSampleRate: 0.1)
- [ ] 느린 쿼리 감지

#### 6.4 알림 설정
- [ ] Sentry 대시보드에서 알림 규칙 생성
  - [ ] CRITICAL 에러 발생 시 즉시 알림
  - [ ] 새로운 에러 발견 시 알림
  - [ ] 에러 급증 시 알림
- [ ] Slack/Discord/Email 연동
- [ ] 알림 받을 팀원 추가

---

### Phase 7: 기존 시스템 통합

#### 7.1 ErrorStore 통합 (Frontend)
- [ ] `apps/table-order/src/stores/errorStore.ts` 수정
  ```typescript
  import * as Sentry from '@sentry/nextjs';

  addError: (error) => {
    // 기존 로직
    set(/* ... */);

    // Sentry에 전송
    Sentry.captureException(new Error(error.message), {
      level: error.severity,
      tags: { errorCode: error.code },
      extra: error.meta,
    });

    // 백엔드 전송 (기존 유지)
    if (error.severity === 'critical') {
      // ...
    }
  }
  ```
- [ ] admin 앱 동일 작업
- [ ] delivery-customer 앱 동일 작업

#### 7.2 Logger Service 통합 (Backend)
- [ ] LoggerService의 error/critical 메서드에 Sentry 추가
- [ ] 기존 Supabase Transport 유지 (이중 저장)
- [ ] Sentry는 실시간 알림용, DB는 감사/백업용

#### 7.3 데이터 흐름 최적화
- [ ] 중복 전송 방지 로직 추가
- [ ] Sample rate 조정 (너무 많은 로그 방지)
- [ ] 민감정보 필터링 (beforeSend)

---

### Phase 8: 테스트

#### 8.1 개발 환경 테스트
- [ ] Frontend 의도적 에러 발생
  ```typescript
  throw new Error('Test error from table-order');
  ```
- [ ] Backend 의도적 에러 발생
- [ ] Sentry 대시보드에서 에러 확인
- [ ] Source map 동작 확인 (원본 코드 라인 표시)
- [ ] 컨텍스트 정보 확인 (user, store, tags)

#### 8.2 프로덕션 배포 전 테스트
- [ ] Staging 환경에서 테스트
- [ ] 실제 사용자 시나리오 테스트
- [ ] 알림 동작 확인
- [ ] Performance 데이터 수집 확인

---

### Phase 9: 문서화

#### 9.1 설정 문서
- [ ] `docs/참고사항/Sentry_설정_가이드.md` 작성
  - 환경변수 설정 방법
  - 각 앱별 설정 가이드
  - 문제 해결 팁

#### 9.2 사용 가이드
- [ ] 개발자용 가이드 작성
  - 에러 로깅 베스트 프랙티스
  - Sentry 대시보드 사용법
  - 알림 대응 프로세스

#### 9.3 README 업데이트
- [ ] 루트 README.md에 Sentry 섹션 추가
- [ ] 환경변수 설정 가이드 링크

---

### Phase 10: 모니터링 및 최적화

#### 10.1 초기 모니터링 (배포 후 1주일)
- [ ] 에러 발생 빈도 확인
- [ ] False positive 확인 및 필터링
- [ ] Sample rate 조정
- [ ] 쿼터 사용량 확인 (무료 플랜: 5,000 events/month)

#### 10.2 알림 튜닝
- [ ] 알림 피로도 체크
- [ ] 중요한 알림만 받도록 필터 조정
- [ ] 에러 그룹핑 최적화

#### 10.3 성능 모니터링
- [ ] 느린 페이지 식별
- [ ] 느린 API 엔드포인트 식별
- [ ] 최적화 대상 선정

---

### Phase 11: 기존 ErrorLog 시스템 재검토

#### 11.1 역할 재정의
- [ ] Sentry: 실시간 모니터링 및 알림
- [ ] ErrorLog DB: 장기 보관 및 감사 로그

#### 11.2 중복 제거 고려
- [ ] Frontend → Backend 에러 전송 필요성 재검토
- [ ] Sentry만 사용할 경우 비용 절감
- [ ] 또는 병행 사용 (추천)

#### 11.3 로그 보관 정책
- [ ] ErrorLog 테이블에 자동 삭제 정책 추가
  ```sql
  -- 90일 이상 로그 자동 삭제
  DELETE FROM "ErrorLog" WHERE "createdAt" < NOW() - INTERVAL '90 days';
  ```
- [ ] Cron job으로 정기 실행

---

## 🎯 우선순위

### 높음 (High Priority)
1. Sentry 계정 및 프로젝트 생성
2. table-order 앱 Sentry 설정 (가장 중요한 앱)
3. backend Sentry 설정
4. 알림 설정

### 중간 (Medium Priority)
5. admin, delivery-customer 앱 설정
6. Performance 모니터링 설정
7. 문서화

### 낮음 (Low Priority)
8. brand-website 설정 (정적 사이트)
9. 기존 시스템 최적화
10. 로그 보관 정책

---

## 📊 예상 일정

- **Phase 1-2**: 1시간 (계정 생성 및 패키지 설치)
- **Phase 3**: 30분 (환경변수 설정)
- **Phase 4**: 2-3시간 (Frontend 설정)
- **Phase 5**: 1-2시간 (Backend 설정)
- **Phase 6**: 1시간 (Sentry 기능 설정)
- **Phase 7**: 2시간 (기존 시스템 통합)
- **Phase 8**: 1시간 (테스트)
- **Phase 9**: 1시간 (문서화)

**총 예상 시간: 9-12시간**

---

## 🚨 주의사항

1. **무료 플랜 제한**: 월 5,000 events
   - Sample rate 조정 필수 (tracesSampleRate: 0.1)
   - 개발환경은 별도 프로젝트 사용 권장

2. **민감정보 필터링**
   - `beforeSend` 콜백으로 비밀번호, 토큰 제거
   - PII (개인식별정보) 자동 스크러빙 활성화

3. **Source Maps 보안**
   - Source maps는 Sentry에만 업로드
   - 프로덕션 빌드에 포함 안 함 (Vercel 자동 처리)

4. **기존 ErrorLog 유지**
   - Sentry는 실시간 모니터링
   - DB는 감사 로그 및 백업
   - 이중 저장 권장

---

## 🔗 참고 링크

- [Sentry Next.js 문서](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry NestJS 문서](https://docs.sentry.io/platforms/node/guides/nestjs/)
- [Sentry 가격 정책](https://sentry.io/pricing/)
- [Sentry 베스트 프랙티스](https://docs.sentry.io/product/best-practices/)
