# @order/ui

공통 UI 컴포넌트 패키지

## 사용하는 앱

- table-order
- delivery-customer
- brand-website
- admin

## 포함 내용

- Button, Card, Modal 등 공통 컴포넌트
- React Hooks
- 스타일 유틸리티

## 사용법

```typescript
import { Button, Card } from '@order/ui';

<Button variant="primary">주문하기</Button>
```

## 개발 가이드

이 패키지는 `@order/shared`에만 의존하며, 비즈니스 로직을 포함하지 않습니다.
