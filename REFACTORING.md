# 모노레포 리팩토링 완료

## ✅ 완료된 작업

### 1. 디렉토리 구조 변경

```bash
# Before
apps/
  ├── frontend/
  ├── admin/
  └── backend/

# After
apps/
  ├── table-order/          # ✅ frontend → table-order 개명
  ├── delivery-customer/    # ✅ 새로 추가 (Capacitor)
  ├── brand-website/        # ✅ 새로 추가
  ├── admin/                # 유지
  └── backend/              # 유지
```

### 2. 패키지 구조 확장

```bash
# Before
packages/
  └── shared/

# After
packages/
  ├── shared/               # ✅ 유지 (타입, 유틸, 상수)
  ├── ui/                   # ✅ 새로 추가 (공통 UI)
  ├── order-core/           # ✅ 새로 추가 (주문 로직)
  └── config/               # ✅ 새로 추가 (설정)
```

### 3. 패키지 의존성 설정

| 앱 | @order/shared | @order/ui | @order/order-core |
|----|---------------|-----------|-------------------|
| **table-order** | ✅ | ⏸️ (향후) | ⏸️ (향후) |
| **delivery-customer** | ✅ | ⏸️ (향후) | ⏸️ (향후) |
| **brand-website** | ✅ | ⏸️ (향후) | ❌ |
| **admin** | ✅ | ⏸️ (향후) | ❌ |

### 4. TypeScript 설정

#### table-order/tsconfig.json
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@order/shared": ["../../packages/shared/src"],
      "@order/ui": ["../../packages/ui/src"],
      "@order/order-core": ["../../packages/order-core/src"]
    }
  }
}
```

#### next.config.ts
```typescript
{
  transpilePackages: ['@order/shared', '@order/ui', '@order/order-core']
}
```

### 5. Capacitor 설정 (delivery-customer)

```bash
✅ 12개 Native 플러그인 설치
✅ Capacitor 헬퍼 함수 12개
✅ 배달 추적 기능
✅ 결제 모듈 (7개 결제 수단)
✅ PWA 지원
```

## 📦 패키지 설명

### @order/shared
**용도**: Frontend ↔ Backend 공통 타입, 상수, 유틸

**내용:**
```
packages/shared/src/
├── types/          # 공통 타입
├── constants/      # 공통 상수
└── utils/          # 공통 유틸
```

**사용 예:**
```typescript
import { OrderStatus } from '@order/shared/types';
import { ORDER_STATUS_LABELS } from '@order/shared/constants';
```

### @order/ui
**용도**: 공통 UI 컴포넌트

**내용:**
```
packages/ui/src/
├── components/     # Button, Card, Modal 등
├── hooks/          # React Hooks
└── styles/         # Tailwind 설정
```

**사용 예:**
```typescript
import { Button, Card } from '@order/ui';
```

### @order/order-core
**용도**: 주문 관련 프론트엔드 비즈니스 로직

**내용:**
```
packages/order-core/src/
├── cart/           # 장바구니
├── order/          # 주문
└── payment/        # 결제
```

**사용 예:**
```typescript
import { useCart } from '@order/order-core/cart';
```

### @order/config
**용도**: 공통 설정 파일

**내용:**
```
packages/config/
├── tsconfig/
│   ├── base.json
│   └── nextjs.json
├── eslint-config/
└── tailwind-config/
```

## 🔄 마이그레이션 가이드

### 기존 코드에서 @order/shared 사용하기

#### Before (기존)
```typescript
// apps/table-order/src/types/order.ts
export type OrderStatus = 'PENDING' | 'ACCEPTED' | 'PREPARING';
```

#### After (리팩토링)
```typescript
// 삭제: apps/table-order/src/types/order.ts

// 사용: packages/shared/src/types/order.ts 의 타입
import { OrderStatus } from '@order/shared/types';
```

### 공통 컴포넌트 분리 (향후)

#### Before
```typescript
// apps/table-order/src/components/Button.tsx
export function Button() { ... }

// apps/delivery-customer/src/components/Button.tsx
export function Button() { ... }  // 중복!
```

#### After
```typescript
// packages/ui/src/components/Button.tsx
export function Button() { ... }

// apps/table-order, delivery 모두 사용
import { Button } from '@order/ui';
```

## 📝 다음 단계

### Phase 1: 즉시 (완료)
- ✅ 디렉토리 구조 변경
- ✅ 패키지 설정
- ✅ TypeScript 경로 설정
- ✅ Capacitor 설정

### Phase 2: 점진적 마이그레이션 (향후)
- [ ] table-order에서 중복 타입 제거 → @order/shared 사용
- [ ] 공통 UI 컴포넌트 → @order/ui로 이동
- [ ] 장바구니 로직 → @order/order-core로 이동

### Phase 3: 최적화 (선택)
- [ ] ESLint 공통 설정 → @order/config
- [ ] Tailwind 공통 설정 → @order/config

## 🎯 현재 상태

```
✅ 모노레포 구조 완성
✅ 5개 앱 (table-order, delivery, brand, admin, backend)
✅ 4개 패키지 (shared, ui, order-core, config)
✅ TypeScript 경로 설정
✅ Capacitor 통합 (delivery-customer)
⏸️ 실제 코드 마이그레이션 (점진적으로 진행)
```

## 📚 참고 문서

- [루트 README](./README.md)
- [delivery-customer README](./apps/delivery-customer/README.md)
- [delivery-customer FEATURES](./apps/delivery-customer/FEATURES.md)
- [아키텍처 결정](./docs/ARCHITECTURE_DECISIONS.md)
- [기술 스펙](./docs/참고사항/tech_spec.md)
