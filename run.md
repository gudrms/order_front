# 🚀 실행 및 빌드 가이드 (Run & Build)

이 문서는 프로젝트 실행, 빌드, 그리고 문제 해결 방법에 대해 다룹니다.

## 📋 필수 요구사항

- Node.js 20.x
- **pnpm 9.x** (필수! - Vercel 호환성)

---

## 🛠️ 설치 (Installation)

### 1. pnpm 설치

```bash
# 방법 1: npm으로 설치
npm install -g pnpm

# 방법 2: Corepack 사용 (Node.js 16.13+)
corepack enable
corepack prepare pnpm@latest --activate
```

### 2. 의존성 설치

```bash
# ⚠️ npm이 아닌 pnpm 사용!
pnpm install
```

> **주의**: 이 프로젝트는 **pnpm 워크스페이스**를 사용하므로 `npm install`은 작동하지 않습니다.

---

## 🏃‍♂️ 개발 서버 실행 (Development)

### 모든 앱 동시 실행
```bash
pnpm dev
```

### 특정 앱만 실행
```bash
pnpm --filter table-order dev         # localhost:3000 (테이블 주문)
pnpm --filter delivery-customer dev   # localhost:3001 (배달 주문)
pnpm --filter brand-website dev       # localhost:3002 (브랜드 웹사이트)
pnpm --filter admin dev               # localhost:3003 (관리자)
pnpm --filter backend dev             # localhost:4000 (백엔드)
```

---

## 🏗️ 빌드 (Build)

### 모든 앱 빌드
```bash
pnpm build
```

### 특정 앱만 빌드
```bash
pnpm --filter table-order build
```

---

## 🔧 유용한 명령어

```bash
# 의존성 추가
pnpm --filter table-order add lodash
pnpm --filter @order/ui add clsx

# 타입 체크
pnpm type-check

# 린트
pnpm lint

# 테스트
pnpm test

# 클린 (node_modules 삭제 등)
pnpm clean
```

---

## 📱 QR 코드 생성 (테이블 주문용)

1. 개발 서버 실행 (`pnpm dev`)
2. 브라우저 접속: `http://localhost:3000/qr-generator.html`
3. 매장 정보 입력 후 QR 코드 생성 및 인쇄

자세한 내용: [QR 코드 주문 가이드](./docs/QR_ORDERING.md)

---

## 🆘 문제 해결 (Troubleshooting)

### pnpm이 없다는 에러
```bash
npm install -g pnpm
```

### workspace:* 에러
```bash
# npm 대신 pnpm 사용
pnpm install
```

### 모듈을 찾을 수 없음 (@order/*)
```bash
# 루트에서 재설치
pnpm install
```

### Capacitor 빌드 실패
```bash
cd apps/delivery-customer
pnpm cap:sync
```
