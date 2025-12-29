# 🎨 Design Guide (디자인 가이드)

> **Note**: 이 문서는 초안입니다. 디자인 변경 사항이 있으면 자유롭게 수정해주세요.

---

## 📋 목차

1. [Color System (색상 시스템)](#1-color-system)
2. [Typography (타이포그래피)](#2-typography)
3. [Spacing (간격)](#3-spacing)
4. [Components (컴포넌트)](#4-components)
5. [Layout (레이아웃)](#5-layout)
6. [Interaction (인터랙션)](#6-interaction)

---

## 1. Color System (색상 시스템)

### 1.1 Brand Colors (브랜드 컬러)

```css
--primary: #ff6b00;           /* 주요 액션 버튼 (오렌지) */
--primary-foreground: #ffffff; /* Primary 위 텍스트 */
--secondary: #333333;          /* 보조 색상 (다크 그레이) */
--secondary-foreground: #ffffff; /* Secondary 위 텍스트 */
```

**사용 예시:**
- **Primary**: 장바구니 담기, 주문하기, 주요 CTA 버튼
- **Secondary**: 닫기, 취소 등 보조 버튼

### 1.2 Status Colors (상태 컬러)

```css
--success: #22c55e;  /* 초록 - 완료, 성공 */
--warning: #f59e0b;  /* 노랑 - 경고, 대기 */
--error: #ef4444;    /* 빨강 - 오류, 취소 */
```

**사용 예시:**
- **Success**: 주문 완료, 접수 완료
- **Warning**: 접수 대기, 조리 중
- **Error**: 주문 취소, 품절

### 1.3 Gray Scale (그레이 스케일)

```css
--gray-50: #f9fafb;   /* 배경 */
--gray-100: #f3f4f6;  /* 비활성 배경 */
--gray-200: #e5e7eb;  /* 테두리 */
--gray-300: #d1d5db;  /* 비활성 테두리 */
--gray-400: #9ca3af;  /* Placeholder */
--gray-500: #6b7280;  /* 보조 텍스트 */
--gray-600: #4b5563;  /* 일반 텍스트 */
--gray-700: #374151;  /* 강조 텍스트 */
--gray-800: #1f2937;  /* 제목 */
--gray-900: #111827;  /* 주요 텍스트 */
```

### 1.4 Background Colors (배경 컬러)

```css
--background: #ffffff;  /* 기본 배경 (라이트 모드) */
--foreground: #171717;  /* 기본 텍스트 */
```

---

## 2. Typography (타이포그래피)

### 2.1 Font Sizes (폰트 크기)

| 크기 | CSS Variable | 값 | 용도 |
|:-----|:-------------|:---|:-----|
| XS | `--font-size-xs` | 0.75rem (12px) | 작은 라벨, 부가 정보 |
| SM | `--font-size-sm` | 0.875rem (14px) | 본문 보조 텍스트 |
| Base | `--font-size-base` | 1rem (16px) | 기본 본문 |
| LG | `--font-size-lg` | 1.125rem (18px) | 강조 본문 |
| XL | `--font-size-xl` | 1.25rem (20px) | 소제목 |
| 2XL | `--font-size-2xl` | 1.5rem (24px) | 제목 |
| 3XL | `--font-size-3xl` | 1.875rem (30px) | 큰 제목 |
| 4XL | `--font-size-4xl` | 2.25rem (36px) | 메인 제목 |

### 2.2 Font Weights (폰트 무게)

| 무게 | CSS Variable | 값 | 용도 |
|:-----|:-------------|:---|:-----|
| Normal | `--font-weight-normal` | 400 | 일반 텍스트 |
| Medium | `--font-weight-medium` | 500 | 약간 강조 |
| Semibold | `--font-weight-semibold` | 600 | 강조 |
| Bold | `--font-weight-bold` | 700 | 제목, 중요 정보 |

### 2.3 사용 예시

```tsx
// 메뉴 이름 - 2XL, Bold
<h3 className="text-2xl font-bold text-gray-900">{menu.name}</h3>

// 메뉴 설명 - SM, Normal
<p className="text-sm text-gray-600">{menu.description}</p>

// 가격 - 2XL, Bold, Primary
<p className="text-2xl font-bold text-primary">{price}원</p>

// 버튼 텍스트 - Base, Semibold
<button className="text-base font-semibold">주문하기</button>
```

---

## 3. Spacing (간격)

### 3.1 기본 간격 규칙

Tailwind CSS 기본 spacing 사용 (4px 단위)

| Class | 값 | 용도 |
|:------|:---|:-----|
| `gap-1` / `p-1` | 4px | 최소 간격 |
| `gap-2` / `p-2` | 8px | 작은 간격 |
| `gap-3` / `p-3` | 12px | 일반 간격 |
| `gap-4` / `p-4` | 16px | 표준 간격 |
| `gap-6` / `p-6` | 24px | 큰 간격 |
| `gap-8` / `p-8` | 32px | 섹션 간격 |

### 3.2 컴포넌트별 권장 간격

**카드 내부:**
- Padding: `p-4` (16px) ~ `p-6` (24px)
- 요소 간 간격: `gap-3` (12px) ~ `gap-4` (16px)

**패널/모달:**
- Padding: `p-6` (24px)
- 섹션 간 간격: `mb-6` (24px)

**버튼:**
- 내부 여백: `px-6 py-3` (24px / 12px)
- 버튼 간 간격: `gap-2` (8px) ~ `gap-4` (16px)

---

## 4. Components (컴포넌트)

### 4.1 Button (버튼)

#### Primary Button (주요 버튼)
```tsx
<button className="rounded-lg bg-primary px-6 py-3 font-semibold text-white hover:opacity-90">
  주문하기
</button>
```

#### Secondary Button (보조 버튼)
```tsx
<button className="rounded-lg border border-gray-300 px-6 py-3 font-medium text-gray-700 hover:bg-gray-50">
  닫기
</button>
```

#### Disabled Button (비활성 버튼)
```tsx
<button
  disabled
  className="cursor-not-allowed rounded-lg bg-gray-300 px-6 py-3 font-semibold text-gray-500"
>
  품절
</button>
```

### 4.2 Card (카드)

```tsx
<div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm hover:shadow-md">
  {/* 카드 내용 */}
</div>
```

### 4.3 Modal (모달)

```tsx
<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
  <div className="w-full max-w-md rounded-lg bg-white p-6">
    {/* 모달 내용 */}
  </div>
</div>
```

### 4.4 Panel (패널) - 우측 고정

```tsx
<div className="fixed right-0 top-0 z-40 h-screen w-96 bg-white shadow-lg transition-transform">
  {/* 패널 내용 */}
</div>
```

### 4.5 Badge (배지)

```tsx
// 성공
<span className="rounded bg-green-500 px-2 py-1 text-xs font-medium text-white">
  완료
</span>

// 경고
<span className="rounded bg-yellow-500 px-2 py-1 text-xs font-medium text-white">
  대기 중
</span>

// 에러
<span className="rounded bg-red-500 px-2 py-1 text-xs font-medium text-white">
  취소됨
</span>
```

### 4.6 Input (입력 필드)

```tsx
<input
  type="text"
  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-primary focus:outline-none"
  placeholder="입력하세요"
/>
```

---

## 5. Layout (레이아웃)

### 5.1 Customer Tablet 레이아웃

```
┌─────────────────────────────────────────────────────────┐
│ Sidebar (140px)    TopBar (full width)                  │
│ ┌──────────────┐  ┌────────────────────────────────────┐│
│ │ 로고         │  │ [카테고리 탭...]    테이블 12      ││
│ │              │  └────────────────────────────────────┘│
│ │ [카테고리]   │                                         │
│ │ [카테고리]   │  Main Content (메뉴 그리드)            │
│ │ [카테고리]   │  ┌──────┬──────┬──────┐                │
│ │              │  │ 메뉴 │ 메뉴 │ 메뉴 │                │
│ │              │  ├──────┼──────┼──────┤                │
│ │              │  │ 메뉴 │ 메뉴 │ 메뉴 │                │
│ │              │  └──────┴──────┴──────┘                │
│ │              │                                         │
│ │ ──────────── │  BottomBar                             │
│ │ [직원호출]   │  [주문내역] [장바구니 (5) 25,000원]    │
│ └──────────────┘  └────────────────────────────────────┘│
└─────────────────────────────────────────────────────────┘
```

### 5.2 Grid System (그리드 시스템)

**메뉴 그리드:**
```tsx
<div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
  {/* 메뉴 카드들 */}
</div>
```

### 5.3 Responsive Breakpoints (반응형 중단점)

| 크기 | 최소 너비 | 용도 |
|:-----|:----------|:-----|
| SM | 640px | 모바일 가로 |
| MD | 768px | 태블릿 |
| LG | 1024px | 데스크톱 |
| XL | 1280px | 큰 화면 |

---

## 6. Interaction (인터랙션)

### 6.1 Hover States (호버 상태)

```tsx
// 버튼
className="... hover:opacity-90"
className="... hover:bg-gray-50"

// 카드
className="... hover:shadow-md"
className="... hover:border-primary"
```

### 6.2 Transitions (전환 효과)

```tsx
// 기본 전환
className="... transition-colors"
className="... transition-transform"
className="... transition-all"

// 시간 조절
className="... transition-colors duration-300"
```

### 6.3 Animations (애니메이션)

**슬라이드 인/아웃 (패널):**
```tsx
className={`... transition-transform duration-300 ${
  isOpen ? 'translate-x-0' : 'translate-x-full'
}`}
```

**페이드 인/아웃 (모달):**
```tsx
className={`... transition-opacity duration-200 ${
  isOpen ? 'opacity-100' : 'opacity-0'
}`}
```

### 6.4 Loading States (로딩 상태)

```tsx
// 스켈레톤 UI (향후 구현)
<div className="animate-pulse bg-gray-200 h-20 rounded-lg" />

// 스피너 (향후 구현)
<div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
```

---

## 7. 향후 개선 사항

### 7.1 추가 예정 컴포넌트

- [ ] **Skeleton UI**: 로딩 상태 개선
- [ ] **Toast/Snackbar**: 알림 메시지
- [ ] **Tooltip**: 도움말 툴팁
- [ ] **Dropdown**: 드롭다운 메뉴
- [ ] **Tabs**: 탭 네비게이션

### 7.2 디자인 시스템 고도화

- [ ] **다크 모드 완성**: 현재 부분적으로만 구현
- [ ] **컴포넌트 라이브러리**: Storybook 도입 검토
- [ ] **디자인 토큰**: CSS Variables 확장
- [ ] **아이콘 시스템**: 통일된 아이콘 세트
- [ ] **이미지 가이드**: 메뉴 이미지 규격 및 최적화

### 7.3 접근성 (Accessibility)

- [ ] **키보드 네비게이션**: Tab, Enter, ESC 지원
- [ ] **스크린 리더**: ARIA 레이블 추가
- [ ] **색상 대비**: WCAG 2.1 AA 기준 준수
- [ ] **포커스 표시**: 포커스 아웃라인 명확화

---

## 📚 참고 자료

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Figma**: (향후 추가 예정)
- **컴포넌트 예시**: `apps/frontend/src/components/`

---

> **Last Updated**: 2024-12-29
> **Author**: Development Team
> **Status**: Draft (초안 - 수정 필요)
