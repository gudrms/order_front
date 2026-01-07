# QR 코드 주문 가이드

테이블 오더 시스템에 QR 코드 주문 기능이 추가되었습니다. 고객이 테이블에 부착된 QR 코드를 스캔하면 자신의 스마트폰으로 주문할 수 있습니다.

## 📱 작동 방식

### 1. 기존 태블릿 주문
```
매장에 비치된 태블릿 → 메뉴 선택 → 주문
```

### 2. QR 코드 주문 (신규)
```
테이블 QR 스캔 → 스마트폰으로 메뉴 열림 → 테이블 번호 자동 설정 → 주문
```

## 🎯 URL 구조

### QR 코드 URL 패턴
```
https://yourdomain.com/[storeType]/[branchId]/table/[tableNumber]
```

### 예시
```
https://yourdomain.com/tacomolly/gimpo/table/5
→ 타코몰리 김포점 5번 테이블
```

## 🛠️ QR 코드 생성 방법

### 방법 1: 웹 생성기 사용 (추천)

1. 브라우저에서 접속:
   ```
   http://localhost:3000/qr-generator.html
   ```

2. 정보 입력:
   - **도메인 주소**: `https://yourdomain.com` (실제 배포 도메인)
   - **매장 타입**: `tacomolly`
   - **지점 ID**: `gimpo`
   - **시작 테이블**: `1`
   - **끝 테이블**: `10`

3. "QR 코드 생성" 버튼 클릭

4. "인쇄하기" 버튼으로 출력

### 방법 2: 프로그래밍 방식

```typescript
import { generateTableQRUrl, generateTableQRUrls } from '@/lib/utils/qr-code';

// 단일 테이블 QR URL 생성
const url = generateTableQRUrl('tacomolly', 'gimpo', 5, 'https://yourdomain.com');
// → 'https://yourdomain.com/tacomolly/gimpo/table/5'

// 여러 테이블 QR URL 일괄 생성
const urls = generateTableQRUrls('tacomolly', 'gimpo', 1, 10, 'https://yourdomain.com');
// → [
//   { tableNumber: 1, url: 'https://yourdomain.com/tacomolly/gimpo/table/1' },
//   { tableNumber: 2, url: 'https://yourdomain.com/tacomolly/gimpo/table/2' },
//   ...
//   { tableNumber: 10, url: 'https://yourdomain.com/tacomolly/gimpo/table/10' }
// ]
```

## 📋 구현 세부사항

### 1. 라우팅 구조

```
apps/table-order/src/app/
├── [storeType]/
│   └── [branchId]/
│       ├── table/
│       │   └── [tableId]/
│       │       └── page.tsx          ← QR 진입점
│       └── (customer)/
│           └── menu/
│               └── page.tsx          ← 메뉴 페이지
```

### 2. QR 스캔 플로우

**Step 1: QR 페이지 진입**
- 파일: `apps/table-order/src/app/[storeType]/[branchId]/table/[tableId]/page.tsx`
- 동작:
  1. URL에서 `tableId` 파라미터 추출
  2. 테이블 번호 유효성 검사
  3. `useTableStore`에 테이블 번호 저장
  4. 메뉴 페이지로 리다이렉트

**Step 2: 메뉴 페이지 표시**
- 파일: `apps/table-order/src/app/[storeType]/[branchId]/(customer)/menu/page.tsx`
- 동작:
  1. `TableConfirmation` 컴포넌트가 자동으로 표시
  2. 사용자에게 테이블 번호 확인 요청
  3. 3초 후 자동으로 사라지거나 "확인" 버튼 클릭
  4. 정상적으로 메뉴 선택 가능

### 3. 테이블 번호 저장소

```typescript
// apps/table-order/src/stores/tableStore.ts
interface TableStore {
  tableNumber: number | null;
  setTableNumber: (tableNumber: number) => void;
  clearTableNumber: () => void;
}
```

### 4. 테이블 확인 UI

```typescript
// apps/table-order/src/components/TableConfirmation.tsx
export function TableConfirmation() {
  // tableNumber가 설정되면 자동으로 모달 표시
  // 3초 카운트다운 후 자동 닫기
  // 사용자가 수동으로 "확인" 버튼 클릭 가능
}
```

## 🎨 사용자 경험

### QR 스캔 → 주문 플로우

1. **QR 스캔**
   ```
   고객이 스마트폰 카메라로 테이블 QR 코드 스캔
   ```

2. **테이블 확인 (3초간 표시)**
   ```
   ┌─────────────────────┐
   │       🪑            │
   │                     │
   │   테이블 번호 확인    │
   │                     │
   │       5번           │
   │                     │
   │ 이 테이블에서 주문   │
   │ 하시는게 맞나요?     │
   │                     │
   │  [ 확인 (3초) ]     │
   └─────────────────────┘
   ```

3. **메뉴 선택**
   ```
   일반 메뉴 페이지와 동일
   좌측 사이드바 + 메뉴 그리드 + 장바구니
   ```

4. **주문 완료**
   ```
   테이블 번호가 자동으로 주문에 포함됨
   ```

## 🔧 설정

### 환경변수

개발 환경에서 기본 매장 설정:

```env
# .env.local
NEXT_PUBLIC_DEFAULT_STORE_TYPE=tacomolly
NEXT_PUBLIC_DEFAULT_BRANCH_ID=gimpo
```

### QR 생성기 기본값

`public/qr-generator.html` 파일에서 기본값 수정:

```html
<input id="baseUrl" value="https://yourdomain.com" />
<input id="storeType" value="tacomolly" />
<input id="branchId" value="gimpo" />
<input id="startTable" value="1" />
<input id="endTable" value="10" />
```

## 📦 배포 가이드

### 1. 프로덕션 도메인 설정

QR 코드 생성 시 실제 도메인 사용:
```
https://order.yourbrand.com
```

### 2. QR 코드 인쇄

- **권장 사이즈**: 5cm x 5cm 이상
- **재질**: 방수 스티커 또는 아크릴 플레이트
- **위치**: 테이블 중앙 또는 메뉴판에 부착

### 3. 테이블 번호 관리

매장에서 사용하는 테이블 번호와 QR 코드 번호를 일치시키세요:

```
물리적 테이블 번호 = QR 코드 tableId = 시스템 테이블 번호
```

## ⚠️ 주의사항

### 1. URL 변경 금지
QR 코드를 인쇄한 후에는 URL 패턴을 변경하지 마세요.
- ❌ `/table/5` → `/t/5` (변경 불가)
- ✅ 새로운 QR 코드 인쇄

### 2. 도메인 변경 시
도메인이 변경되면 모든 QR 코드를 재인쇄해야 합니다.

### 3. HTTPS 필수
프로덕션 환경에서는 반드시 HTTPS 사용:
- ✅ `https://order.yourbrand.com`
- ❌ `http://order.yourbrand.com`

## 🧪 테스트

### 로컬 테스트

1. 개발 서버 실행:
   ```bash
   pnpm --filter table-order dev
   ```

2. QR 생성기 접속:
   ```
   http://localhost:3000/qr-generator.html
   ```

3. 테스트 URL 복사 (예: `http://localhost:3000/tacomolly/gimpo/table/5`)

4. 브라우저 새 탭에서 URL 직접 입력하여 테스트

### 모바일 테스트

1. 로컬 네트워크에서 접속:
   ```
   http://[내-PC-IP]:3000/tacomolly/gimpo/table/5
   ```

2. QR 코드 생성 후 스마트폰으로 스캔

## 📊 분석 및 모니터링

### 추후 추가 가능한 기능

1. **QR 스캔 로그**
   - 어떤 테이블에서 QR이 가장 많이 스캔되는지 추적
   - 시간대별 QR 스캔 통계

2. **A/B 테스트**
   - 태블릿 주문 vs QR 주문 비율
   - 전환율 비교

3. **사용자 피드백**
   - QR 주문 만족도 조사

## 🆘 문제 해결

### QR 스캔이 작동하지 않음

1. **URL 확인**
   ```bash
   # QR 코드 URL이 올바른지 확인
   https://yourdomain.com/tacomolly/gimpo/table/5
   ```

2. **도메인 접근 가능 여부**
   ```bash
   # 스마트폰에서 도메인 접속 테스트
   curl https://yourdomain.com
   ```

3. **HTTPS 인증서**
   - Vercel/Netlify는 자동 HTTPS 제공
   - 커스텀 도메인은 SSL 인증서 설정 필요

### 테이블 번호가 표시되지 않음

1. **브라우저 콘솔 확인**
   ```javascript
   // tableStore 상태 확인
   console.log(useTableStore.getState().tableNumber);
   ```

2. **URL 파라미터 확인**
   ```javascript
   // tableId가 올바르게 전달되는지 확인
   console.log(window.location.pathname);
   // → /tacomolly/gimpo/table/5
   ```

## 📚 관련 문서

- [README.md](../README.md) - 전체 프로젝트 개요
- [ARCHITECTURE_DECISIONS.md](./ARCHITECTURE_DECISIONS.md) - 아키텍처 결정
- [tech_spec.md](./참고사항/tech_spec.md) - 기술 스펙
