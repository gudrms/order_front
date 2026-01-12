# 📱 Frontend - Table Order System

> Next.js 15 기반 태블릿 주문 시스템 Frontend

## 📋 개요

고객이 테이블 태블릿에서 직접 메뉴를 주문할 수 있는 웹 애플리케이션입니다.

---

## 🌐 도메인 설정 (Domain Configuration)

| 서비스 | 도메인 | 설명 |
|---|---|---|
| **관리자 (Admin)** | `https://admin.tacomole.kr` | 매장/메뉴 관리 |
| **웹사이트 (Website)** | `https://tacomole.kr` | 브랜드 소개 |
| **테이블 오더 (Table Order)** | `https://order.tacomole.kr` | 매장 내 주문 (현재 프로젝트) |
| **배달 앱 (Delivery)** | `https://delivery.tacomole.kr` | 배달 주문 |
| **백엔드 서버 (Backend)** | `https://api.tacomole.kr` | API 서버 |

---

## 🚀 기술 스택

- **Framework**: Next.js 15.1.6 (App Router, TypeScript)
- **Styling**: Tailwind CSS
- **State**: Zustand (클라이언트), TanStack Query (서버)
- **Testing**: Vitest, Testing Library
- **Mock API**: MSW 2.x
- **PWA**: Next-PWA

---

## 📁 주요 구조

```
src/
├── app/                # Next.js App Router
├── components/ui/      # Presenter 컴포넌트
├── features/           # Container 컴포넌트 + hooks
├── stores/             # Zustand 상태 관리
├── lib/                # 유틸리티
├── mocks/              # MSW Mock
└── __tests__/          # Vitest 테스트
```

---

## 🔧 실행

```bash
# 환경 변수 설정 (.env.local)
# 로컬 개발 시
NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1
# 프로덕션/테스트
# NEXT_PUBLIC_API_URL=https://api.tacomole.kr/api/v1

NEXT_PUBLIC_USE_MOCK=true

# 개발 서버
pnpm dev
# → http://localhost:3000

# 테스트
pnpm test

# 빌드
pnpm build
```

---

## 🧪 테스트 현황

✅ **24개 테스트 전체 통과**
- cartStore: 13개
- CartItemCard: 11개

---

## 🎨 주요 기능

1. **메뉴 조회**: 카테고리별 메뉴, 상세보기, 옵션 선택
2. **장바구니**: 실시간 업데이트, 수량 조절
3. **주문 생성**: API 호출, 주문번호 표시
4. **MSW**: Backend 없이 개발 가능

---

## 🏗️ Container/Presenter 패턴

**Presenter** (UI만):
```typescript
// components/ui/CartSummary.tsx
export function CartSummary({ totalPrice, onOrder }: Props) {
  return <Button onClick={onOrder}>주문하기</Button>;
}
```

**Container** (로직):
```typescript
// features/cart/components/CartSummaryContainer.tsx
export function CartSummaryContainer() {
  const { totalPrice } = useCartStore();
  return <CartSummary totalPrice={totalPrice} onOrder={handleOrder} />;
}
```

---

## 📦 배포

**테이블 오더**: https://order.tacomole.kr
(Vercel: https://order-front-frontend.vercel.app)

**환경 변수**:
```
NEXT_PUBLIC_API_URL=https://api.tacomole.kr/api/v1
NEXT_PUBLIC_USE_MOCK=false
```

---

## 📚 참고

- [Next.js 문서](https://nextjs.org/docs)
- [Root README](../../README.md)
