# DineOS (식당 운영 통합 시스템)

식당 체인을 위한 옴니채널 주문 통합 플랫폼 - 매장 주문(태블릿/QR), 배달 주문(PWA/App), 주방 및 관리자 대시보드, 브랜드 홈페이지를 단일 모노레포에서 유기적으로 연결한 All-in-One 플랫폼입니다.

---

## 📅 프로젝트 정보

| **항목** | **내용** |
| --- | --- |
| **기간** | 2025.10 ~ 진행 중 |
| **팀 구성** | 1인 (개인 프로젝트) |
| **역할** | 풀스택 아키텍트 & 개발자 |
| **형태** | 모노레포 (pnpm Workspace + Turborepo) |

---

## 🛠 기술 스택

### Frontend
- **Framework:** Next.js 16.1.1 (App Router), React 19.2, TypeScript 5
- **Styling:** Tailwind CSS 4, Shadcn UI 기반 공통 디자인 시스템 컴포넌트 패키지
- **State Management:** Zustand 5 (클라이언트 전역 상태), TanStack Query 5 (서버 상태 캐싱 및 동기화)
- **PWA / Hybrid App:** Next-PWA (Service Worker 캐싱), Capacitor 6 (Native 플러그인 연동 및 iOS/Android 하이브리드 앱 빌드)
- **Testing:** Vitest (단위 테스트), Testing Library, Playwright (크로스 브라우저/앱 E2E 통합 테스트)

### Backend
- **Framework:** NestJS 10, TypeScript 5
- **ORM / Database:** Prisma 5, PostgreSQL 17 (Supabase Managed DB)
- **Message Queue:** pgmq (PostgreSQL 기반 트랜잭셔널 메시지 큐)
- **Cache & Rate Limit:** Redis (ioredis) - Vercel Serverless 다중 인스턴스 간 분산 Throttler 카운터 공유 저장소
- **Security:** Helmet.js, Content Security Policy (CSP), Custom Client IP Throttler, CORS Allowlist, Supabase JWT Guard, POS API Key Guard
- **Logger & Monitoring:** Winston, Sentry (Sensitive Header Stripping 적용), Vercel Logs
- **API Docs:** Swagger / OpenAPI Spec (Scalar UI CDN 임베딩으로 서버리스 ESM 호환성 버그 회피)

### DevOps & Infrastructure
- **Monorepo Build System:** pnpm Workspace + Turborepo (Remote Caching 적용)
- **Deployment:** Vercel (Frontend & Backend Serverless), Supabase (Auth, Database, Storage)
- **CI/CD:** GitHub Actions (Type Check, Lint, Vitest, Playwright E2E 통합 빌드 파이프라인)

---

## 🏗 시스템 구조

4개의 핵심 프론트엔드 서비스와 1개의 백엔드 API, 4개의 공유 패키지를 단일 모노레포에서 오케스트레이션합니다. 추가로 점포 연동을 위한 Toss POS 플러그인과 데스크톱 확장을 위한 Admin Electron 앱까지 동일한 의존성 관리 하에 운영됩니다.

```txt
apps/
├── table-order        # 매장 태블릿/QR 주문 (PWA Standalone Kiosk 모드)
├── delivery-customer  # 배달 주문 (Web/PWA + Capacitor 하이브리드 iOS/Android)
├── admin              # 주방 실시간 화면 + 통합 관리자 대시보드
├── brand-website      # 브랜드 홈페이지 (SEO 최적화 정적 사이트, SSG)
├── backend            # NestJS 통합 API (Vercel Serverless 배포)
├── toss-pos-plugin    # Toss POS 단말기 임베디드 웹앱 플러그인
└── admin-electron     # 주방/카운터용 데스크톱 래퍼 앱 (Electron)

packages/
├── @order/shared      # 공통 API 클라이언트, DTO 타입, 유틸리티, 상수 정의
├── @order/ui          # Shadcn UI 기반 공통 디자인 시스템 컴포넌트 라이브러리
├── @order/order-core  # 장바구니 계산, 가격 검증 등 핵심 비즈니스 로직 엔진 (Zustand)
└── @order/config      # ESLint, TSConfig, Tailwind 빌드 공통 구성 설정
```

---

## 📱 주요 서비스 및 아키텍처 디테일

### 1️⃣ Table Order (매장 태블릿/QR 주문)
매장 내 고정형 태블릿 및 고객의 개인 스마트폰(QR 스캔)을 지원하는 공개 주문 시스템입니다. 
- **PWA Standalone Kiosk 모드:** 브라우저 주소창을 숨기는 `standalone` 디스플레이 설정과 `@ducanh2912/next-pwa` 기반의 서비스 워커 프리캐싱을 통해, 저사양 태블릿에서도 전용 키오스크 머신 앱과 동일한 UX를 제공합니다.
- **실시간 테이블 동기화:** Supabase Realtime (`postgres_changes` 구독) 및 5초 주기 Polling의 이중화 아키텍처를 채택하여, 결제 상태 변경 및 테이블 상태를 지연 시간 없이 실시간으로 갱신합니다.
- **QR 진입 자동화:** QR 코드 파라미터(`?storeId=...&table=...`) 분석 후, 테이블 세션 자동 바인딩 및 3초 확인 카운트다운을 제공하여 오주문을 방지합니다.

### 2️⃣ Delivery Customer (배달 주문)
단일 코드베이스로 모바일 웹, PWA, Android/iOS 네이티브 앱을 동시 지원하는 옴니채널 배달 플랫폼입니다.
- **Remote WebView 하이브리드 아키텍처:** Next.js 웹앱을 Capacitor WebView 환경에서 실행하되, 정적 번들을 로컬에 패키징하는 대신 `CAPACITOR_SERVER_URL`을 Vercel 원격 배포 도메인(`https://delivery.tacomole.kr`)으로 지향하도록 아키텍처를 설계했습니다. 이를 통해 **앱스토어 재심사 없이 웹 프론트엔드 배포만으로 앱 화면이 즉시 갱신되는 핫 업데이트(OTA)** 효과를 극대화했습니다.
- **하이브리드 보안 분기:** 로컬 HTTP 개발 서버 환경에서만 `cleartext` 및 `allowMixedContent`를 활성화하고, 운영 빌드에서는 이를 원천 차단하여 중간자 공격(MITM)을 방어합니다.
- **Native 플러그인 통합 (12종):** Camera(리뷰), Geolocation(GPS 기반 배달 주소 자동 완성), Push/Local Notifications(배달 상태 변화 진동/사운드 수신), Haptics(진동 피드백), Network(오프라인 감지 및 백업 폴백) 등을 네이티브 레벨로 연결했습니다.
- **Toss Payments 위젯 연동 및 앱 리다이렉션:** WebView 내에서 토스페이먼츠 iframe 결제창을 정상 구동하고, 결제 완료 시 모바일 커스텀 스키마(`taco://...`)를 호출하여 안전하게 하이브리드 앱 컨텍스트로 복귀 및 주문을 매끄럽게 승인하는 리다이렉션 파이프라인을 구축했습니다.

### 3️⃣ Admin Dashboard (통합 관리자 및 주방 시스템)
매장의 주문 접수, 배달 관제, 통계 분석을 수행하는 점주용 통합 관리 백오피스입니다.
- **Supabase Realtime 관제:** PostgreSQL의 `LISTEN / NOTIFY` 기반 Realtime 변경 사항을 구독하여 새 주문 및 직원 호출 이벤트를 100ms 이내에 감지하고, 브라우저가 비활성화 상태여도 소리 및 Toast 알림을 트리거합니다.
- **POS 동기화 예외 처리 UI:** 외부 POS 단말기 통신 실패 시 수동으로 동기화를 재시도하는 전용 대시보드를 구축하여 현장 대처 능력을 높였습니다.
- **매출 다차원 시각화:** Recharts 기반의 일별/주별/월별 매출 차트 및 상품별 판매 분석 대시보드를 제공합니다.

### 4️⃣ Brand Website (브랜드 홈페이지)
브랜드 스토리 및 가맹 문의를 유도하기 위한 정적 최적화 마케팅 페이지입니다.
- **정적 생성(SSG) 및 SEO 극대화:** Next.js static export를 통한 극도의 CDN 캐싱 최적화, Sitemap/Robots 자동화, JSON-LD 구조화 데이터 적용으로 포털 사이트 검색 노출을 극대화했습니다.
- **지오코딩 기반 매장 찾기:** 카카오 지도 API와 Kakao REST API 지오코딩 서비스를 연동하여, 관리자가 주소를 등록하면 위경도 좌표로 자동 자동변환 후 지도 상에 정밀한 핀 렌더링 및 클릭 연동 스크롤 카드를 구성했습니다.
- **스팸 방지 Honeypot 필드:** 가맹 신청 폼에 봇 탐지용 숨김 필드(`<input name="website" />`)를 배치하고, 서버 단에서 해당 값이 입력되었을 경우 저장 및 메일 발송 API를 거치지 않고 성공 응답만 반환하여 백엔드 리소스를 낭비하지 않는 무중단 스팸 필터를 구현했습니다.

---

## 💡 기술적 도전 & 해결 (트러블슈팅 & 보안 엔지니어링)

### 1. 3중 장애 격리 & Circuit Breaker 아키텍처 (POS 연동 실패 완벽 복구)
외부 POS(Toss POS) 시스템 장애가 발생했을 때 전체 플랫폼(배달/테이블) 주문 결제 프로세스가 다운되는 **장애 전파 현상**을 막기 위해 **Circuit Breaker + Queue Retry + Admin 수동 재시도**로 이어지는 3중 방어 구조를 설계했습니다.

```
[주문 완료] ──> DB 저장 (status: PAID) ──> [pgmq] order.paid 이벤트 발행
                                                  │
                                          (Toss POS 매장 검증)
                                                  │
                                                  ▼
                                      [pgmq] pos.send_order 발행
                                                  │
                                                  ▼
                                  ResilientPosService.sendOrder()
                             ┌──────────────────────────────────┐
                             │    Circuit Breaker (opossum)     │
                             └─────────────────┬────────────────┘
                                               │
                                      ┌────────┴────────┐
                                    성공              실패 (Timeout/Error)
                                      │                 │
                                      ▼                 ▼
                              posSyncStatus:    Circuit Breaker OPEN
                                  "SENT"        즉시 Fallback & 백오프 큐 스케줄링
                                                        │
                                                        ▼
                                                Queue Retry (pgmq)
                                                10초 -> 30초 -> 60초 -> 3분 -> 5분
                                                (5회 초과 시 영구 보존 보관함 이동)
                                                        │
                                                        ▼
                                                점주 Admin Dashboard
                                                수동 동기화(Retry) 트리거 UI 지원
```

- **Circuit Breaker (opossum v9.0.0):** 타임아웃 3,000ms, 실패율 50% 임계치 도달 시 즉시 OPEN 상태로 전환하여 외부 POS API 호출을 차단하고 Fallback 로직을 수행합니다. 10초 대기 후 HALF-OPEN 상태에서 1건의 요청을 테스트하여 복구를 확인합니다.
- **Idempotency(멱등성) 보장:** 모든 주문 및 결제 이벤트에 고유 `idempotencyKey`를 할당하고, 백엔드의 `QueueEventLog` 테이블에서 이미 성공(`SUCCEEDED`) 처리된 내역이 존재하면 중복 큐 처리를 자동으로 스킵하여 POS 이중 등록 및 이중 결제 승인을 차단합니다.

### 2. Vercel Serverless 분산 Rate Limiting (Redis-backed CustomThrottlerGuard)
서버리스 람다 환경은 매 요청마다 다른 인스턴스가 띄워질 수 있어, 단일 메모리 기반의 API Rate Limit 카운터는 분산 환경에서 동작하지 않습니다. 또한, Vercel Edge 프록시 뒷단에 위치하여 `req.ip`를 그대로 신뢰할 경우 프록시 IP가 차단되거나 클라이언트 IP 위변조 공격에 취약해집니다.
- **CustomThrottlerGuard 구현:** NestJS 전역 가드 레벨에서 `x-forwarded-for` 헤더를 안전하게 파싱하여 첫 번째 IP(클라이언트 실제 IP)를 추출하고, 이를 기반으로 Redis(`ioredis`) 인스턴스에 접근하여 분산 카운터를 누적하도록 설계했습니다.
- **보안 임계치 차별화:** 1초 10회 / 1분 100회 / 15분 1,000회 세분화된 Throttle 스키마를 적용하여, 악의적인 트래픽 폭주 및 API 크롤링 공격을 차단하고 429 Too Many Requests 예외를 명확히 제어합니다.

### 3. 서버리스 환경의 304 CORS 캐시 오염(Cache Pollution) 방어
동일한 백엔드 API 서버를 배달앱(`delivery.tacomole.kr`), 브랜드 사이트(`tacomole.kr`), 어드민(`admin.tacomole.kr`) 등 여러 프론트엔드가 공유함에 따라, **특정 도메인의 CORS ACAO(Access-Control-Allow-Origin) 헤더가 브라우저 ETag 기반 304 응답에 캐싱되어 다른 도메인의 CORS 접근을 차단하는 크로스 사이트 캐시 오염 이슈**가 발생했습니다.
- **ETag 완전 비활성화:** 백엔드 Express 어댑터 단에서 `expressApp.set('etag', false)` 설정을 적용하여 무의미한 ETag 기반 304 응답 생성을 원천 차단했습니다.
- **캐시 차단 정책 수립:** 모든 API 응답 헤더에 `Cache-Control: no-store`를 강제 적용하여 브라우저 수준의 불필요한 API 캐싱을 차단했습니다.
- **CDN 캐시 격리:** `Vary: Origin` 헤더를 모든 응답에 주입하여, Vercel CDN/Edge 가 서버 응답을 캐싱할 때 요청 Origin별로 별도의 캐시 키를 생성하도록 보장하여 다중 도메인 간의 간섭을 영구히 해소했습니다.

### 4. Vercel Serverless Queue Cold Start 단축 (QueueAppModule 구성)
일반적으로 NestJS로 큐 소비(Consumer) 백그라운드 작업을 실행할 경우, 전체 웹 서비스 모듈(인증, 메뉴, 결제, 쿠폰 등)을 전부 부팅해야 하므로 서버리스 환경에서 극심한 **Cold Start 타임아웃**이 발생합니다.
- **Slim Bootstrap 분리:** 일반 API용 진입점(`api/index.ts` -> AppModule)과 큐 작업용 백그라운드 진입점(`api/queue.ts` -> QueueAppModule)을 물리적 파일로 완전 분리했습니다.
- **QueueAppModule 경량화:** 데이터베이스 및 큐 드라이버(`QueueModule`), FCM 푸시 전송(`NotificationsModule`), 설정(`ConfigModule`) 등 핵심 백그라운드 작업 의존성만 주입하도록 패키징하여, **부팅에 소요되는 모듈 수를 60% 이상 감소시켜 Cold Start 시간을 수백 밀리초 단위로 단축**시켰습니다.

### 5. 가맹점 안전 강화를 위한 계정 보안 모델 혁신
불특정 다수를 위한 가맹 가입 폼 및 초대코드 기반 셀프 회원가입은 초대코드 유출 시 무인가 공격자가 점주 권한을 획득할 수 있는 심각한 위험을 내포합니다.
- **무인증 가입 경로 영구 차단:** 일반 `/auth/register` 엔드포인트를 폐기하고 외부 가입 페이지를 완전히 소거했습니다.
- **마스터 직접 권한 관리 모델:** 최고 마스터 관리자(`ADMIN`)만이 백오피스에서 점주의 이메일과 매장 정보를 매핑하여 계정을 생성할 수 있도록 차단했습니다.
- **Supabase Admin API 통합:** 백엔드에서 `SUPABASE_SERVICE_KEY` (service_role 권한)를 안전하게 다루며 Supabase Auth Admin API를 통해 이메일 인증이 완료된 계정(`email_confirm: true`)을 즉시 강제 발급하고 데이터베이스 행과 원자적으로 묶어 보안 안전망을 극대화했습니다.

### 6. 철저한 서버 단 가격 위변조 검증 (Defensive Programming)
클라이언트가 전달한 주문 상품 목록의 개별 단가 및 합계 금액을 전적으로 신뢰할 경우, 브라우저 콘솔이나 프록시 툴을 활용한 결제 금액 변조 공격에 무방비 상태가 됩니다.
- **서버 단 원천 재산정:** 주문 생성 시 클라이언트가 보낸 단가 정보는 모두 무시하고 오직 `menuId`, `optionId`, `quantity`만 수신합니다.
- **Prisma 트랜잭션 동적 조회:** 단일 데이터베이스 트랜잭션 내에서 최신 `Menu` 테이블과 `MenuOption` 테이블의 실제 가격 값을 1:N 관계로 안전하게 긁어와 서버단에서 금액을 재계산합니다.
- **최종 정합성 검증:** 계산된 최종 합계가 클라이언트가 위변조한 결제 요청액 및 Toss Payments 결제 정보와 단 1원이라도 불일치할 시, 즉각 400 Bad Request 에러로 주문을 파기하여 재정적 위협을 방지합니다.

### 7. 인프라 보안 위생 수호 (Git History 시크릿 완전 박멸)
과거 커밋에 기록되어 남아 있던 Supabase DB 패스워드 및 Toss Access Key 등의 유출 흔적을 없애기 위해 단순 커밋 덮어쓰기가 아닌 Git 히스토리 개조 작업을 진행했습니다.
- **`git-filter-repo` 활용:** Python 기반의 히스토리 재작성 툴을 통해 Git Repository 내의 304개 커밋을 통째로 재빌드하여 유출된 env 파일의 모든 과거 커밋 로그를 완벽하게 소거 및 강제 푸시를 수행하여 인프라 위생 수준을 기업형 포트폴리오급으로 고도화했습니다.

---

## 📊 성과

### 💻 기술적 성과
1. **모노레포 기반 초격차 의존성 관리:** 4개의 프론트엔드 앱과 백엔드를 단일 모노레포로 구조화하고, `@order/shared` 및 `@order/order-core` 패키지를 통해 API 호출 코드와 비즈니스 로직 중복을 0%에 가깝게 제거했습니다.
2. **3중 장애 격리율 100%:** Circuit Breaker와 pgmq 백오프 재시도 시스템 도입으로 외부 POS API 장애 상황 발생 시에도 전체 사용자 주문이 막히지 않고 안전하게 큐에 누적되는 장애 탄력성을 입증했습니다.
3. **서버 운영 비용 100% 절감:** 기존 Naver Cloud Platform(Server 2vCPU 4GB + DB) 구성 시 매달 발생하던 약 95,000원의 고정 비용을, Vercel Serverless와 Supabase Free Tier의 동적 요청 최적화를 통해 운영 극초기 비용 **월 0원**으로 세팅하는 비용 아키텍처를 구현했습니다.
4. **검증된 테스트 커버리지:** 백엔드 핵심 비즈니스 로직(결제, 주문, 큐, 보안)에 대해 **Vitest 150개 이상의 테스트 케이스**를 구축하여 무결성을 검증했으며, Playwright를 이용해 실시간 결제 결과 페이지 12개 흐름, 장바구니 풀 스택 11개 시나리오, 정적 브랜드 사이트 21개 검증 등 프론트엔드 핵심 시나리오의 E2E 테스트 자동화를 완료했습니다.

### 📈 비즈니스 성과
1. **실제 필드 도입 준비 완료:** 인천 지역을 중심으로 한 7개 오프라인 매장의 가족 식당 체인(타코몰리) 실적용을 목표로 비즈니스 요구사항을 수렴 및 커스터마이징하여, 기존 태블릿 주문(티오더 등) 솔루션 대체 시 **연간 수백만 원의 고정 수수료 및 렌탈 비용 절감 효과**를 확인했습니다.
2. **완벽한 옴니채널 통합 경험:** 매장 고객을 위한 QR/태블릿 주문 환경과 배달 앱 환경이 단일 데이터베이스 및 어드민으로 통합되어, 매장 내 인력 동선을 획득하고 배달 라이더 연동까지의 전 과정을 원스톱으로 관리 가능한 통합 OS 기틀을 닦았습니다.

---

## 📈 향후 계획 (Future Roadmap)

- **AI 기반 스마트 매장 어드민 고도화:** 점포별 누적 매출 추이를 머신러닝 모델로 시각화하여 내일의 식자재 소요량을 예측하고 품목별 재고 관리를 자동화하는 지능형 관리 모듈 탑재
- **iOS App Store 심사 및 출시:** iOS 전용 빌드 환경(macOS/Xcode)을 완벽 고정하여 딥링크 테스트 완료 후 Apple App Store 심사 및 네이티브 앱 배포 완료
- **WAF Edge 방어선 추가 구축:** Vercel Firewall 및 Cloudflare WAF 계층을 적용하여, 애플리케이션 레벨의 Throttler를 넘어 대규모 L7 DDoS 및 웹 취약점 스캔 공격을 Edge 단에서 사전 드롭시키는 프로덕션급 보안 고도화
- **실시간 비즈니스 인텔리전스 인프라:** 사용자 유입 대비 주문 완료 퍼널(Funnel) 이탈률 분석을 위해 PostHog 등 이벤트 기반 프로덕트 분석 인프라를 연결하여 비즈니스 데이터 기반 의사결정 체계 확보
