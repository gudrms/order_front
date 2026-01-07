# 📦 Components

재사용 가능한 공통 컴포넌트 폴더입니다.

## 📁 폴더 구조

### `ui/`
기본 UI 컴포넌트 (원자 단위)
- `Button.tsx` - 버튼 컴포넌트
- `Input.tsx` - 입력 필드
- `Card.tsx` - 카드 컨테이너
- `Modal.tsx` - 모달 팝업
- `Drawer.tsx` - 사이드 슬라이드
- `Badge.tsx` - 뱃지
- `Spinner.tsx` - 로딩 인디케이터
- `Toast.tsx` - 알림 메시지

### `layout/`
레이아웃 컴포넌트
- `Header.tsx` - 헤더
- `Sidebar.tsx` - 사이드바
- `Footer.tsx` - 푸터
- `Container.tsx` - 컨테이너

## 💡 사용 예시

```tsx
import { Button } from '@/components/ui/Button';
import { Header } from '@/components/layout/Header';

export default function MyPage() {
  return (
    <>
      <Header />
      <Button variant="primary">클릭</Button>
    </>
  );
}
```

## 📝 작성 규칙

1. **재사용성**: 여러 곳에서 사용될 수 있는 컴포넌트만 포함
2. **Props 타입**: TypeScript 인터페이스로 Props 정의 필수
3. **스타일링**: Tailwind CSS 사용
4. **네이밍**: PascalCase (예: `MenuCard.tsx`)
5. **Export**: Named export 사용 권장
