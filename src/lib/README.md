# 📚 Lib

유틸리티, API 클라이언트, 상수 등을 관리하는 폴더입니다.

## 📁 폴더 구조

### `api/`
API 클라이언트 및 통신 로직
- `client.ts` - Axios/Fetch 기본 설정
- `endpoints.ts` - API 엔드포인트 정의
- `interceptors.ts` - 요청/응답 인터셉터

### `utils/`
유틸리티 함수들
- `formatters.ts` - 날짜, 가격 포맷팅
- `validators.ts` - 유효성 검증
- `helpers.ts` - 기타 헬퍼 함수
- `cn.ts` - Tailwind className 병합 (clsx + tailwind-merge)

### `constants/`
상수 정의
- `routes.ts` - 라우트 경로
- `api.ts` - API 관련 상수
- `config.ts` - 앱 설정값

## 💡 사용 예시

### API 클라이언트
```tsx
import { apiClient } from '@/lib/api/client';
import { ENDPOINTS } from '@/lib/api/endpoints';

const fetchMenus = async () => {
  const response = await apiClient.get(ENDPOINTS.menus.list);
  return response.data;
};
```

### 유틸리티 함수
```tsx
import { formatPrice, formatDate } from '@/lib/utils/formatters';

const price = formatPrice(15000); // "15,000원"
const date = formatDate(new Date()); // "2024-12-26"
```

### 상수
```tsx
import { ROUTES } from '@/lib/constants/routes';
import { API_CONFIG } from '@/lib/constants/config';

router.push(ROUTES.customer.menu);
console.log(API_CONFIG.baseURL);
```

## 📝 작성 규칙

1. **순수 함수**: 부수 효과 없이 작성
2. **네이밍**: camelCase (함수), UPPER_SNAKE_CASE (상수)
3. **타입**: TypeScript 타입 정의 필수
4. **테스트**: 유틸리티 함수는 단위 테스트 작성 권장
