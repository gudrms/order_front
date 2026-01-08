# 환경 변수 관리 가이드

## 📁 파일 구조

```
order_front/
├── .env                      # ✅ 공통 기본 환경 변수 (Git 커밋)
├── .env.development          # ✅ 개발 환경 공통 설정 (Git 커밋)
├── .env.production           # ✅ 운영 환경 공통 설정 (Git 커밋)
├── .env.example              # ✅ 예제 파일 (Git 커밋)
├── .env.local                # ❌ 로컬 오버라이드 (Git 제외)
├── apps/
│   ├── delivery-customer/
│   │   ├── .env.local        # ❌ 앱별 로컬 설정 (Git 제외)
│   │   └── .env.example      # ✅ 앱별 예제 (Git 커밋)
│   ├── table-order/
│   │   ├── .env.local        # ❌ 앱별 로컬 설정 (Git 제외)
│   │   └── .env.example      # ✅ 앱별 예제 (Git 커밋)
│   └── admin/
│       ├── .env.local        # ❌ 앱별 로컬 설정 (Git 제외)
│       └── .env.example      # ✅ 앱별 예제 (Git 커밋)
```

---

## 🔄 우선순위 (Next.js 기본)

```
1. .env.local (앱별 - 최우선)
2. .env.production / .env.development (공통 - 환경별)
3. .env (공통 - 기본값)
```

**예시**: `pnpm dev` 실행 시
```
.env.local > .env.development > .env
```

**예시**: `pnpm build` 실행 시
```
.env.local > .env.production > .env
```

---

## 📦 공통 환경 변수 (루트)

### `.env` - 모든 앱 공통 기본값

```env
# Supabase (모든 앱 공유)
NEXT_PUBLIC_SUPABASE_URL=https://liuaztalfeibucjoexvp.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=sb_publishable_b2xDLqP4YSBGX-6uUeYajA_F0cQ5sc9

# 토스페이먼츠 (테스트 키)
NEXT_PUBLIC_TOSS_CLIENT_KEY=test_ck_D5GePWvyJnrK0W0k6q8gLzN97Eoq

# 기본 Store ID
NEXT_PUBLIC_STORE_ID=store-1
```

### `.env.development` - 개발 환경

```env
# API URL (개발)
NEXT_PUBLIC_API_URL=http://localhost:3000/api/v1

# Mock 데이터 사용
NEXT_PUBLIC_USE_MOCK=true
```

### `.env.production` - 운영 환경

```env
# API URL (운영)
NEXT_PUBLIC_API_URL=https://api.yourdomain.com/api/v1

# Mock 데이터 비활성화
NEXT_PUBLIC_USE_MOCK=false
```

---

## 🎯 앱별 오버라이드 (선택)

각 앱에서 특정 값만 변경하고 싶을 때 `.env.local` 사용:

### `apps/delivery-customer/.env.local`

```env
# 배달 앱은 포트 3001 사용
NEXT_PUBLIC_API_URL=http://localhost:3001/api/v1
```

### `apps/table-order/.env.local`

```env
# 테이블 오더는 Mock 사용
NEXT_PUBLIC_USE_MOCK=true
NEXT_PUBLIC_DEFAULT_STORE_TYPE=tacomolly
```

---

## 🚀 사용 방법

### 1. 초기 설정 (처음 클론 시)

```bash
# 1. 예제 파일을 복사하여 로컬 환경 변수 생성
cp .env.example .env.local

# 2. .env.local 파일 열어서 실제 값으로 수정
# - NEXT_PUBLIC_SUPABASE_URL: 실제 Supabase URL
# - NEXT_PUBLIC_SUPABASE_ANON_KEY: 실제 Anon Key
# - NEXT_PUBLIC_TOSS_CLIENT_KEY: 실제 토스 키 (또는 테스트 키)
```

### 2. 개발 환경 실행

```bash
# 자동으로 .env.development 사용
pnpm dev
```

### 3. 운영 환경 빌드

```bash
# 자동으로 .env.production 사용
pnpm build
```

### 4. 앱별 설정 변경

```bash
# 특정 앱만 다른 설정 사용
cd apps/delivery-customer
echo "NEXT_PUBLIC_API_URL=http://localhost:4000/api/v1" > .env.local
pnpm dev
```

---

## ✅ 장점

### 1. 중앙 관리
- ✅ 공통 설정 한 곳에서 관리
- ✅ Supabase, 토스페이먼츠 등 모든 앱 동기화
- ✅ 실수로 다른 값 설정 방지

### 2. 환경별 분리
- ✅ 개발/운영 설정 자동 전환
- ✅ Git에 커밋되어 팀원 공유
- ✅ 브랜치 필요 없음

### 3. 유연성
- ✅ 앱별 오버라이드 가능
- ✅ 로컬 테스트 자유롭게
- ✅ `.env.local`은 Git 제외

---

## 🔒 보안

### Git에 커밋하는 파일
```
✅ .env.example      # 예제 템플릿만
```

### Git에서 제외하는 파일 (전부!)
```
❌ .env              # 기본값
❌ .env.local        # 개인 로컬 설정
❌ .env.development  # 개발 환경
❌ .env.production   # 운영 환경
❌ .env.*.local      # 기타 모든 환경 변수
```

### 민감 정보 처리

**모든 환경 변수는 Git에서 제외**되며, 다음 방법으로 관리:

1. **로컬 개발**:
   ```bash
   cp .env.example .env.local
   # 실제 값으로 수정
   ```

2. **Vercel 배포**:
   - Vercel Dashboard > Project Settings > Environment Variables
   - 또는 `vercel env add` CLI 사용

3. **기타 배포**:
   - Docker Secrets (컨테이너)
   - AWS Secrets Manager (클라우드)

---

## 📝 변경 시나리오

### 시나리오 1: Supabase URL 변경

**Before**:
```bash
# 3개 파일 수정 필요
apps/delivery-customer/.env.local
apps/table-order/.env.local
apps/admin/.env.local
```

**After**:
```bash
# 1개 파일만 수정
.env
```

### 시나리오 2: 개발 → 운영 전환

**Before**:
```bash
# 모든 앱 .env 수정 필요
```

**After**:
```bash
# 빌드 명령만 변경
pnpm dev         # 자동으로 .env.development 사용
pnpm build       # 자동으로 .env.production 사용
```

---

## 🎯 Best Practices

### 1. 공통 설정은 루트에
```env
# .env (루트)
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_TOSS_CLIENT_KEY=...
```

### 2. 앱별 설정은 최소화
```env
# apps/delivery-customer/.env.local
# 정말 필요한 것만
NEXT_PUBLIC_DELIVERY_SPECIFIC_CONFIG=...
```

### 3. 민감 정보는 .env.local
```env
# .env.local (Git 제외)
NEXT_PUBLIC_TOSS_CLIENT_KEY=ck_live_real_key_here
```

### 4. 예제 파일 유지
```bash
# 항상 .env.example 업데이트
cp .env .env.example
# 실제 값 제거 후 커밋
```

---

## 🐛 문제 해결

### Q: 환경 변수가 적용 안 됨

```bash
# Next.js 재시작 필요
pnpm dev
```

### Q: 앱마다 다른 값 필요

```bash
# 앱별 .env.local 생성
cd apps/your-app
echo "YOUR_VAR=value" > .env.local
```

### Q: Git에 환경 변수 올리고 싶음

```bash
# ❌ 절대 안 됨! 보안 문제
# .env.example만 수정해서 커밋
git add .env.example
git commit -m "update env example template"
```

---

## 📚 참고

- [Next.js 환경 변수 문서](https://nextjs.org/docs/basic-features/environment-variables)
- [Monorepo 환경 변수 Best Practices](https://turbo.build/repo/docs/handbook/environment-variables)
