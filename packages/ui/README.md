# @order/ui

여러 앱에서 공유하는 React UI 컴포넌트 패키지입니다. 화면 비즈니스 로직은 넣지 않고, 재사용 가능한 표현 컴포넌트만 관리합니다.

## 공개 컴포넌트

```ts
import { Badge, Button, CartItemCard, MenuOptionList } from '@order/ui';
```

| 컴포넌트 | 용도 |
|---|---|
| `Button` | 공통 버튼 variant/size |
| `Badge` | 상태/라벨 표시 |
| `CartItemCard` | 장바구니 아이템 표시 |
| `MenuOptionList` | 메뉴 옵션 선택 UI |

## 결제 위젯

Toss Payments 위젯은 SSR 이슈를 피하기 위해 루트 barrel에서 export하지 않습니다. 필요한 앱에서 서브패스로 가져오고, Next.js에서는 dynamic import를 사용합니다.

```tsx
import dynamic from 'next/dynamic';

const TossPaymentWidget = dynamic(
  () => import('@order/ui/payment').then((mod) => mod.TossPaymentWidget),
  { ssr: false },
);
```

## 기술 기준

- React 19
- TypeScript
- Tailwind CSS
- `class-variance-authority`
- `clsx`
- `tailwind-merge`
- `lucide-react`

## 개발 확인

```bash
pnpm --filter @order/ui type-check
```
