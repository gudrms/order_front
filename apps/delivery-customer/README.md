# Delivery Customer App

고객이 배달 주문을 생성하고 Toss Payments 결제를 진행하는 Next.js + Capacitor 앱입니다.

## 실행

```bash
pnpm --filter delivery-customer dev
```

로컬 주소: `http://localhost:3001`
운영 주소: `https://delivery.tacomole.kr`

## 주요 역할

- 배달 가능 매장/메뉴 조회
- 주소 입력과 배달 가능 여부 확인
- 장바구니와 주문 금액 계산
- Toss Payments 결제 모듈 진입
- 주문 생성과 결제 승인 결과 처리
- Capacitor 기반 Android/iOS 앱 빌드
- FCM/Web Push 디바이스 등록과 푸시 알림 수신

Toss POS 연동이 없어도 Toss Payments 결제 모듈을 통한 배달 결제는 가능합니다. 현금 결제는 현재 운영 기준에서 제외합니다.

## 앱 개발

```bash
pnpm --filter delivery-customer cap:sync
pnpm --filter delivery-customer cap:open:android
pnpm --filter delivery-customer android
```

iOS 빌드는 macOS/Xcode 환경에서 진행합니다.

운영 WebView 빌드는 `CAPACITOR_SERVER_URL=https://delivery.tacomole.kr` 기준으로 `cap sync`를 수행합니다. 로컬 HTTP 개발 서버를 붙일 때만 cleartext/allowMixedContent가 허용됩니다.

## Android 서명 지문

현재 운영 지문:

```text
6D:AC:8F:5E:5D:A7:AF:F6:80:01:16:6D:78:17:B6:29:62:F2:DC:82:5F:DC:3D:7C:B7:B3:4B:61:B9:04:F2:80
```

기존 앱 업데이트가 목적이면 기존 release keystore를 유지해야 합니다. keystore를 새로 만들면 기존 앱의 업데이트로 인식되지 않을 수 있습니다. Google Play App Signing 사용 여부는 Play Console에서 확인합니다.

## 확인

```bash
pnpm --filter delivery-customer build
pnpm --filter delivery-customer type-check
```

## 문서

- [운영자 인수인계](../../docs/operator-handoff.md)
- [테스트 시나리오](../../docs/test-scenarios)
- [배포 가이드](../../docs/deployment.md)
