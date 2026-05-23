# 운영자 인수인계

운영 중 장애 확인, 배포 확인, 백그라운드 작업 확인에 필요한 최소 절차입니다.

## 서비스 URL

| 서비스 | URL | 확인 포인트 |
|---|---|---|
| Backend API | `https://api.tacomole.kr/api/v1` | API, health, 운영 배치 |
| API Docs | `https://api.tacomole.kr/api/docs` | Scalar 문서 |
| Admin | `https://admin.tacomole.kr` | 관리자 로그인, 매장/메뉴/주문 관리 |
| Table Order | `https://order.tacomole.kr` | QR 테이블 주문 |
| Delivery Customer | `https://delivery.tacomole.kr` | 배달 주문 |
| Brand Website | `https://tacomole.kr` | 브랜드 웹사이트 |

`https://admin.tacomole.kr/health`는 정상 헬스체크 주소가 아닙니다. 관리자 앱은 Next.js 프론트엔드이고 `/health`를 제공하지 않습니다. 백엔드 상태는 `https://api.tacomole.kr/api/v1/health`로 확인합니다.

## 빠른 장애 확인

1. `https://api.tacomole.kr/api/v1/health` 응답을 확인합니다.
2. Vercel Dashboard에서 실패한 최신 배포와 Runtime Logs를 확인합니다.
3. GitHub Actions의 `Backend Cron Jobs` 최근 실행 결과를 확인합니다.
4. 관리자 `주문/운영` 화면에서 주문 상태, 결제 상태, 큐 처리 여부를 확인합니다.
5. 결제 장애는 Toss 승인 상태와 로컬 DB의 payment/order 상태가 같은지 확인합니다.

## 백그라운드 작업

Vercel 서버리스 환경의 콜드스타트 완화(메뉴 조회 예열)와 결제/큐 보정 등 핵심 백그라운드 배치는 **Upstash QStash** 스케줄러를 사용하여 **오전 10시 ~ 밤 12시(00시) KST** 동안 5분마다 단일 통합 배치 API로 일괄 실행합니다.

* **실행 주기:** `*/5 10-23 * * *` (Timezone: `Asia/Seoul`)
* **장점:** 러너 고부하로 지연되던 GitHub Actions와 달리 100% 실행 신뢰성을 보장하며, 비영업 시간에는 크론이 잠들도록 설정하여 Upstash 무료 티어(일 500회) 안에서 하루 168회 호출로 안전하게 무중단 운영됩니다.

실행 파이프라인 단계:

1. **DB 연결 확인** (`SELECT 1`)
2. **매장 메뉴 조회 웜업** (`MenusService.getMenus(storeId)`로 쿼리 엔진 및 커넥션 예열)
3. **백엔드 큐 소비** (quantity: 3으로 1회 처리)
4. **대기 결제 만료 정리**
5. **결제 불일치 보정**

### QStash 스케줄 세팅 정보

* **Destination URL:** `POST https://api.tacomole.kr/api/v1/cron/batch`
* **Cron Expression:** `*/5 10-23 * * *`
* **Timezone:** `Asia/Seoul`
* **Required Header:**
  * `x-internal-job-secret`: 백엔드 환경변수 `INTERNAL_JOB_SECRET`와 일치하는 값

### 수동 확인 및 장애 조치:

1. **Upstash Console**의 **QStash → Schedules** 메뉴로 이동합니다.
2. `https://api.tacomole.kr/api/v1/cron/batch` 스케줄의 상태(최근 실행 결과)가 성공인지 확인합니다.
3. 즉시 배치 실행이 필요하거나 강제 복구를 하려면 대시보드에서 즉시 트리거하거나 아래와 같이 `curl` 명령어로 수동 호출합니다:
   ```bash
   curl -X POST https://api.tacomole.kr/api/v1/cron/batch \
     -H "x-internal-job-secret: [INTERNAL_JOB_SECRET_값]"
   ```

## 운영 엔드포인트

아래 엔드포인트는 운영 배치 또는 관리자 수동 복구에 사용합니다.

| Method | Path | 목적 | 인증 |
|---|---|---|---|
| `GET` | `/health` | API 상태 확인 | 없음 |
| `POST` | `/cron/batch` | **통합 배치 & 웜업 파이프라인 (추천)** | `x-internal-job-secret` |
| `POST` | `/queue/process-once` | 큐 1회 단독 처리 | `x-internal-job-secret` |
| `POST` | `/payments/toss/expire-pending` | 오래된 미승인 결제 단독 정리 | `x-internal-job-secret` |
| `POST` | `/payments/toss/reconcile` | Toss 승인/로컬 DB 불일치 단독 보정 | `x-internal-job-secret` |

헤더 이름은 `x-internal-job-secret`입니다.

## 배포 확인

- 일반 배포: `master` push 후 Vercel이 변경된 프로젝트만 빌드합니다.
- 선택 배포 기준: [vercel-selective-deploy.md](vercel-selective-deploy.md)
- 전체 배포 절차: [deployment.md](deployment.md)
- 수동 테스트 순서: [test-scenarios](test-scenarios)

배포 후 최소 확인:

1. `GET https://api.tacomole.kr/api/v1/health`
2. 관리자 로그인
3. 매장/메뉴 조회
4. 테이블오더 QR 진입
5. 배달 주문 결제 모듈 진입
6. GitHub Actions `Backend Cron Jobs` 성공 여부

## 결제/주문 운영 기준

- Toss POS 연동이 없어도 Toss Payments 결제 모듈을 통한 배달 결제는 가능합니다.
- 현금 결제는 현재 운영 기준에서 제외합니다.
- 결제 승인 후 주문 확정 실패가 의심되면 `/payments/toss/reconcile`을 실행합니다.
- 오래된 `PENDING_PAYMENT` 주문이 남으면 `/payments/toss/expire-pending`을 실행합니다.

## Android 앱 서명 지문

Android 패키지명은 Play Console 기준 `com.tacomole.app`입니다. `capacitor.config.ts`의 `appId`, Android `applicationId`, App Links `assetlinks.json`의 `package_name`이 모두 이 값과 일치해야 합니다.

Play App Signing 앱 서명 키 SHA-256:

```text
6D:AC:8F:5E:5D:A7:AF:F6:80:01:16:6D:78:17:B6:29:62:F2:DC:82:5F:DC:3D:7C:B7:B3:4B:61:B9:04:F2:80
```

키를 새로 발급해야 하는 경우:

- 기존 release keystore를 잃어버렸을 때
- 앱 배포 채널을 새로 만들고 기존 앱 업데이트 호환성이 필요 없을 때
- 보안 사고로 서명키 교체가 필요할 때

기존 앱을 업데이트해야 하고 release keystore가 보관되어 있다면 새 key를 만들면 안 됩니다. 같은 keystore로 서명해야 기존 앱의 업데이트로 인식됩니다. Google Play App Signing을 사용하는 경우에는 업로드 키와 앱 서명 키가 분리됩니다. App Links 검증용 `assetlinks.json`에는 Play Console의 앱 서명 키 SHA-256을 사용합니다.

2026-05-16 기준 `apps/delivery-customer/public/.well-known/assetlinks.json`에는 위 앱 서명 키 SHA-256을 반영했습니다. 운영 배포 후 `https://delivery.tacomole.kr/.well-known/assetlinks.json`에서 같은 값이 내려오는지 확인해야 합니다.

## Android 앱 운영 메모

배달 앱은 `CAPACITOR_SERVER_URL=https://delivery.tacomole.kr` 원격 WebView 방식입니다. 네이티브 앱 시작은 정상이어도 운영 웹 JS가 잘못된 Capacitor 플러그인 호출을 하면 Play 설치본이 시작 직후 종료될 수 있습니다. 앱 크래시 핫픽스가 웹 코드에만 있으면 AAB 재심사 전에도 운영 delivery 웹 배포 반영 여부를 먼저 확인합니다.

Android 푸시와 OAuth 기준:

- Android Push Notifications는 `android/app/google-services.json`과 Firebase Android 앱 `com.tacomole.app` 설정이 준비된 뒤 활성화합니다.
- Firebase 설정 전에는 Vercel delivery 앱의 `NEXT_PUBLIC_CAPACITOR_PUSH_ENABLED`를 unset 또는 `false`로 유지합니다.
- 카카오 OAuth 앱 복귀는 Supabase Redirect URLs의 `taco://auth/callback`과 Android Manifest의 `taco` scheme을 함께 사용합니다.
- OAuth 완료 후 웹 브라우저에 남거나 홈이 비로그인 상태면 callback 복귀와 WebView 세션 복원 로그를 확인합니다.

Android Studio Logcat은 로그인 진단 때 `Auth`, `AuthCallback`, `DeepLink` 필터를 우선 사용합니다. 크래시는 `FATAL EXCEPTION` 또는 `AndroidRuntime`으로 확인합니다. `View`, `VRI`, `setRequestedFrameRate`는 WebView 렌더 로그라 운영 판단에서는 보통 제외합니다.

## 보안/비밀값 관리

- `INTERNAL_JOB_SECRET`은 GitHub Actions Secret과 Vercel backend 환경변수에 같은 값으로 설정합니다.
- Toss, Supabase, FCM, Sentry 키는 저장소에 커밋하지 않습니다.
- 운영 키를 교체하면 Vercel 재배포와 GitHub Actions 수동 실행으로 즉시 확인합니다.
