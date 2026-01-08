# 소셜 로그인 설정 가이드

## ✅ 구현 완료

- [x] Supabase Auth 설정
- [x] 카카오 로그인
- [x] Apple 로그인 (뼈대)
- [x] AuthProvider (자동 로그인)
- [x] 로그인 UI

---

## 🔧 설정 방법

### 1. Supabase 프로젝트 생성

1. https://supabase.com 접속
2. 새 프로젝트 생성
3. Dashboard > Settings > API에서 키 확인
   - `Project URL`: `https://xxxxx.supabase.co`
   - `anon/public key`: `eyJhbGciOi...`

### 2. 환경 변수 설정

`.env.local` 파일 생성:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

---

## 🥑 카카오 로그인 설정

### 1. 카카오 개발자 앱 등록

1. https://developers.kakao.com 접속
2. **내 애플리케이션 > 애플리케이션 추가하기**
3. 앱 이름 입력 후 생성

### 2. REST API 키 발급

1. **내 애플리케이션 > 앱 설정 > 요약 정보**
2. **REST API 키** 복사

### 3. Redirect URI 설정

1. **내 애플리케이션 > 제품 설정 > 카카오 로그인**
2. **카카오 로그인 활성화** ON
3. **Redirect URI 등록**:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

### 4. 동의 항목 설정

1. **제품 설정 > 카카오 로그인 > 동의 항목**
2. **필수 동의**:
   - 닉네임
   - 프로필 사진

### 5. Supabase에 카카오 Provider 설정

1. Supabase Dashboard > **Authentication > Providers**
2. **Kakao** 선택
3. **Enable** ON
4. **Client ID**: 카카오 REST API 키
5. **Client Secret**: (비워둠 - Kakao는 불필요)
6. **Save**

---

## 🍎 Apple 로그인 설정 (iOS 앱 출시 시)

### 1. Apple Developer 등록

1. https://developer.apple.com
2. Apple Developer Program 가입 (연 $99)

### 2. Service ID 생성

1. **Certificates, Identifiers & Profiles**
2. **Identifiers > Services IDs > +**
3. Description 입력
4. Identifier 입력 (예: `com.yourbrand.delivery`)
5. **Sign in with Apple** 체크
6. **Configure** 클릭
7. Redirect URI 추가:
   ```
   https://your-project.supabase.co/auth/v1/callback
   ```

### 3. Private Key 생성

1. **Keys > +**
2. **Sign in with Apple** 체크
3. Download `.p8` 파일
4. Key ID 복사

### 4. Supabase에 Apple Provider 설정

1. Supabase Dashboard > **Authentication > Providers**
2. **Apple** 선택
3. **Enable** ON
4. **Client ID**: Service ID
5. **Client Secret**: Private Key 내용
6. **Save**

---

## 🚀 사용 방법

### 로그인 페이지

```
http://localhost:3001/login
```

### 로그인 상태 확인

```typescript
import { useAuth } from '@/contexts/AuthContext';

function MyComponent() {
  const { user, loading } = useAuth();

  if (loading) return <div>로딩 중...</div>;
  if (!user) return <div>로그인 필요</div>;

  return <div>안녕하세요, {user.email}</div>;
}
```

### 로그아웃

```typescript
import { useAuth } from '@/contexts/AuthContext';

function LogoutButton() {
  const { signOut } = useAuth();

  return <button onClick={signOut}>로그아웃</button>;
}
```

---

## 🔄 자동 로그인

- **Refresh Token**이 LocalStorage에 자동 저장됨
- 앱 재실행 시 자동으로 세션 복구
- Token 만료 시 자동 갱신

---

## 🧪 테스트

### 1. 카카오 로그인 테스트

1. http://localhost:3001/login 접속
2. **카카오 로그인** 버튼 클릭
3. 카카오톡 로그인
4. 자동으로 `/` 리다이렉트

### 2. 자동 로그인 테스트

1. 로그인 후 브라우저 새로고침
2. 자동으로 로그인 상태 유지 확인

### 3. 로그아웃 테스트

1. 개발자 도구 > Console
2. `const { signOut } = useAuth(); signOut();`
3. 로그아웃 확인

---

## ⚠️ 주의사항

### 1. OAuth Redirect URI 주의

- **개발**: `http://localhost:3001/auth/callback`
- **배포**: `https://yourdomain.com/auth/callback`
- Supabase는 자동으로 `/auth/v1/callback` 사용

### 2. Next.js Static Export 제한

- Capacitor 사용 시 Static Export 모드
- OAuth는 클라이언트 사이드에서만 동작
- Server Components 사용 불가

### 3. 카카오 앱 심사

- 실제 운영 전 카카오 앱 심사 필요
- 개발 단계에서는 등록된 테스터만 로그인 가능

---

## 📚 참고 문서

- [Supabase Auth 문서](https://supabase.com/docs/guides/auth)
- [카카오 로그인 가이드](https://developers.kakao.com/docs/latest/ko/kakaologin/common)
- [Apple Sign In 가이드](https://developer.apple.com/sign-in-with-apple/)
