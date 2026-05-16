# 배달 앱 배포 가이드 (Android/iOS)

타코몰리 배달 앱을 Google Play Store와 App Store에 배포하는 전체 과정을 안내합니다.

## 📋 목차

1. [사전 준비물](#-사전-준비물)
2. [Android 배포](#-android-배포-google-play-store)
3. [iOS 배포](#-ios-배포-app-store)
4. [버전 관리](#-버전-관리)
5. [업데이트 배포](#-업데이트-배포)
6. [자동화 (선택)](#-자동화-cicd-선택)
7. [트러블슈팅](#-트러블슈팅)
8. [배포 체크리스트](#-배포-체크리스트)

---

## 🎯 사전 준비물

### 공통 필수사항

```
✅ 개발자 계정
   - Google Play Console: $25 (일회성)
   - Apple Developer: $99/년

✅ 개인정보처리방침 URL
   - 앱 스토어 심사 필수
   - 운영 URL: https://www.tacomole.kr/privacy

✅ 앱 마케팅 자료
   - 앱 아이콘 (1024x1024px, PNG)
   - 스크린샷 (각 플랫폼별 요구사항)
   - 앱 설명 (짧은 설명, 긴 설명)
   - 프로모션 이미지

✅ 개발 환경
   - Node.js 18+ 설치
   - pnpm 설치
   - Android Studio (Android 배포)
   - Xcode (iOS 배포, Mac 필수)
```

### Android 전용

```
✅ Android Studio 설치
   https://developer.android.com/studio

✅ JDK 17+ 설치
   Android Studio와 함께 설치됨

✅ Keystore 파일 (앱 서명용)
   ⚠️ 절대 분실 금지!
   분실 시 앱 업데이트 불가능
```

### iOS 전용

```
✅ Mac 컴퓨터
   Xcode는 macOS에서만 실행 가능

✅ Xcode 15+ 설치
   App Store에서 무료 다운로드

✅ Apple Developer 계정
   https://developer.apple.com
```

---

## 📱 Android 배포 (Google Play Store)

### Step 1: Keystore 생성 (처음 한 번만)

```bash
# 프로젝트 루트에서 실행
cd apps/delivery-customer

# Keystore 생성
keytool -genkey -v -keystore android/app/taco-release-key.keystore \
  -alias taco-key \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# 입력 정보:
# - Keystore 비밀번호 (강력한 비밀번호 설정)
# - 이름, 조직 등 (앱 정보 입력)
# - Key 비밀번호 (Keystore 비밀번호와 동일하게 설정 권장)
```

⚠️ **중요**: 생성된 `taco-release-key.keystore` 파일과 비밀번호는 안전하게 보관하세요!

### Step 2: Keystore 정보 설정

```bash
# android/key.properties 파일 생성
cat > android/key.properties << EOL
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=taco-key
storeFile=taco-release-key.keystore
EOL
```

⚠️ **보안**: `key.properties`는 절대 Git에 커밋하지 마세요! (`.gitignore`에 추가됨)

### Step 3: 앱 빌드 준비

```bash
# 1. 웹 앱 빌드
pnpm --filter delivery-customer build

# 2. Capacitor 동기화 (운영 원격 WebView URL 반영)
$env:CAPACITOR_SERVER_URL='https://delivery.tacomole.kr'
pnpm --filter delivery-customer exec cap sync android

# 3. 패키지명 확인
# capacitor.config.ts appId와 android/app/build.gradle applicationId는 com.tacomole.app이어야 함
```

### Step 4: Android Studio에서 AAB 생성

```bash
# Android Studio 열기
pnpm cap:open:android

# Android Studio에서:
# 1. Build → Generate Signed Bundle/APK
# 2. "Android App Bundle" 선택 → Next
# 3. "Choose existing..." 클릭
#    → android/app/taco-release-key.keystore 선택
# 4. Keystore 정보 입력
#    - Key store password: [입력]
#    - Key alias: taco-key
#    - Key password: [입력]
# 5. "release" 빌드 타입 선택
# 6. Finish 클릭
# 7. 빌드 완료까지 대기 (5-10분)
```

생성 위치: `android/app/release/app-release.aab`

CLI로 빌드할 때는 Android 프로젝트에서 다음을 실행합니다.

```powershell
$env:JAVA_HOME='C:\Users\USER\.jdks\jbr-17.0.14'
$env:PATH="$env:JAVA_HOME\bin;$env:PATH"
.\gradlew.bat bundleRelease --no-daemon
```

Gradle 기본 산출물은 `android/app/build/outputs/bundle/release/app-release.aab`입니다. Play Console 업로드 편의를 위해 필요하면 `android/app/release/app-release.aab`로 복사합니다.

업로드 전 서명 확인:

```powershell
jarsigner -verify -verbose -certs android/app/release/app-release.aab
```

출력에 `jar verified.`와 `Signed by "CN=jhg, OU=taco, O=taco, L=incheon, ST=incheon, C=KR"`가 보이면 업로드 키 서명이 들어간 상태입니다. 자체 서명 인증서 경고는 Google Play 업로드 키에서는 정상입니다.

### Step 5: Google Play Console 업로드

```bash
# 1. Google Play Console 접속
https://play.google.com/console

# 2. 앱 만들기 (처음 한 번만)
# - 앱 이름: 타코몰리
# - 패키지명: com.tacomole.app
# - 기본 언어: 한국어
# - 앱/게임: 앱
# - 무료/유료: 무료

# 3. 앱 정보 입력
# - 짧은 설명 (80자 이내)
# - 전체 설명 (4000자 이내)
# - 앱 아이콘 (512x512px)
# - 그래픽 이미지 (1024x500px)
# - 스크린샷 (최소 2개, 권장 8개)
#   * 휴대전화: 최소 320px, 최대 3840px
#   * 종횡비: 16:9 또는 9:16

# 4. 스토어 설정
# - 카테고리: 음식 및 음료
# - 콘텐츠 등급: 설문 작성
# - 대상 고객: 모든 연령

# 5. 내부 테스트 → 새 버전 만들기
# - app-release.aab 업로드
# - 버전 정보 입력 (변경사항 설명)
# - 검토 제출

# 6. Play App Signing의 앱 서명 키 SHA-256 확인
# - assetlinks.json에는 업로드 키가 아니라 앱 서명 키 SHA-256 사용
```

### Step 6: 출시 확인

```bash
# Google Play Console에서 상태 확인
# - 검토 중
# - 승인됨
# - 게시됨

# 스토어 링크 확인
https://play.google.com/store/apps/details?id=com.tacomole.app
```

---

## 🍎 iOS 배포 (App Store)

### Step 1: Apple Developer 계정 설정

```bash
# 1. Apple Developer 계정 등록
https://developer.apple.com
# - $99/년 결제
# - 계정 승인까지 1-2일 소요

# 2. Bundle Identifier 등록
# - developer.apple.com → Certificates, Identifiers & Profiles
# - Identifiers → + 버튼
# - App IDs 선택
# - Bundle ID: com.tacomole.app (역도메인 형식)
```

### Step 2: 앱 빌드 준비 (Mac 필수)

```bash
# 1. 웹 앱 빌드
pnpm --filter delivery-customer build

# 2. Capacitor 동기화
pnpm --filter delivery-customer exec cap sync ios

# 3. CocoaPods 설치 (처음 한 번만)
cd ios/App
pod install
cd ../..
```

### Step 3: Xcode 설정

```bash
# Xcode 열기
pnpm cap:open:ios

# Xcode에서:
# 1. Signing & Capabilities 탭
# - Team: [Apple Developer 계정 선택]
# - Bundle Identifier: com.tacomole.app

# 2. General 탭
# - Display Name: 타코몰리
# - Version: 1.0.0 (capacitor.config.ts와 동일하게)
# - Build: 1 (업데이트 시마다 증가)

# 3. 시뮬레이터에서 테스트
# - Product → Destination → iPhone 14 Pro 선택
# - Product → Run (Cmd + R)
```

### Step 4: Archive 생성

```bash
# Xcode에서:
# 1. Product → Destination → Any iOS Device (arm64)
# 2. Product → Archive
# 3. Archive 완료까지 대기 (5-10분)
# 4. Organizer 창 자동 오픈
```

### Step 5: App Store Connect 업로드

```bash
# Organizer 창에서:
# 1. 방금 생성한 Archive 선택
# 2. "Distribute App" 클릭
# 3. "App Store Connect" 선택 → Next
# 4. "Upload" 선택 → Next
# 5. 자동 서명 옵션 그대로 → Next
# 6. Upload 클릭
# 7. 업로드 완료까지 대기 (5-10분)
```

### Step 6: App Store Connect 설정

```bash
# 1. App Store Connect 접속
https://appstoreconnect.apple.com

# 2. 앱 만들기 (처음 한 번만)
# - 이름: 타코몰리
# - 기본 언어: 한국어
# - Bundle ID: com.tacomole.app
# - SKU: tacomole-delivery-001

# 3. 앱 정보 입력
# - 부제목 (30자 이내)
# - 설명 (4000자 이내)
# - 키워드 (100자 이내, 쉼표로 구분)
# - 지원 URL: https://www.tacomole.kr
# - 마케팅 URL: https://www.tacomole.kr

# 4. 스크린샷 업로드
# - 6.5" Display (iPhone 14 Pro Max)
#   * 최소 3개, 최대 10개
#   * 1290 x 2796px 또는 2796 x 1290px
# - 5.5" Display (선택)

# 5. 가격 및 배포
# - 가격: 무료
# - 국가/지역: 대한민국 선택

# 6. 앱 심사 정보
# - 연락처 정보
# - 데모 계정 (필요 시)
# - 참고 사항

# 7. 버전 정보
# - 버전: 1.0.0
# - 빌드 선택 (방금 업로드한 빌드)
# - 새로운 기능 설명

# 8. 심사 제출
```

### Step 7: 심사 대기 및 출시

```bash
# App Store Connect에서 상태 확인
# - 심사 대기 중
# - 심사 중 (보통 24-48시간)
# - 승인됨
# - 판매 준비 완료

# 승인 후 자동 출시 또는 수동 출시 선택 가능

# 스토어 링크 확인
https://apps.apple.com/kr/app/tacomole/id[APP_ID]
```

---

## 📦 버전 관리

### 버전 번호 규칙

```
Major.Minor.Patch (예: 1.2.3)

Major (1.x.x): 대규모 변경, 호환성 변경
Minor (x.2.x): 새 기능 추가
Patch (x.x.3): 버그 수정, 개선
```

### 버전 업데이트 방법

```typescript
// capacitor.config.ts
export default {
  appId: 'com.tacomole.app',
  appName: '타코 배달',
  version: '1.0.1',  // 여기만 수정
  // ...
}
```

```json
// package.json (선택)
{
  "name": "delivery-customer",
  "version": "1.0.1",  // 동기화 권장
  // ...
}
```

### iOS Build 번호

```bash
# Xcode에서 Build 번호만 증가
# General → Build: 1 → 2 → 3 ...
# (Version은 capacitor.config.ts와 동일하게 유지)
```

---

## 🔄 업데이트 배포

### 업데이트 프로세스

```bash
# 1. 코드 수정 및 테스트
pnpm dev
# 기능 개발 또는 버그 수정

# 2. 버전 업데이트
# capacitor.config.ts에서 version 수정
# 1.0.0 → 1.0.1

# 3. 빌드
pnpm build
pnpm cap:sync

# 4. Android 업데이트
pnpm cap:open:android
# Android Studio에서 AAB 재생성
# Google Play Console에서 새 버전 업로드

# 5. iOS 업데이트
pnpm cap:open:ios
# Xcode에서 Build 번호 증가 (1 → 2)
# Product → Archive
# App Store Connect 업로드

# 6. 변경사항 작성
# - 각 스토어의 "새로운 기능" 섹션 업데이트
# - 사용자에게 명확하게 전달

# 7. 심사 제출
```

### 긴급 업데이트 (핫픽스)

```bash
# 치명적 버그 수정 시

# 1. 버그 수정 코드 작성
# 2. Patch 버전 증가 (1.0.0 → 1.0.1)
# 3. 빠른 빌드 및 배포
# 4. Google Play: 긴급 업데이트 옵션 선택
# 5. App Store: 심사 노트에 긴급 상황 설명
```

---

## 🤖 자동화 (CI/CD, 선택)

### Fastlane 설정 (추후 적용)

```bash
# Fastlane 설치
gem install fastlane

# Android 초기화
cd android
fastlane init

# iOS 초기화
cd ios/App
fastlane init

# 자동 배포
fastlane android deploy
fastlane ios deploy
```

### GitHub Actions (추후 적용)

```yaml
# .github/workflows/deploy.yml
name: Deploy Apps

on:
  push:
    tags:
      - 'v*'

jobs:
  deploy-android:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to Google Play
        run: fastlane android deploy

  deploy-ios:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Deploy to App Store
        run: fastlane ios deploy
```

---

## 🔧 트러블슈팅

### Android 문제

#### 1. Keystore 비밀번호 잊어버림

```bash
# 해결 불가 😭
# - 새 Keystore 생성
# - 새 앱으로 등록 (기존 앱은 업데이트 불가)
# - 사용자는 새로 설치 필요

# 예방:
# - Keystore와 비밀번호를 안전한 곳에 백업
# - 1Password, LastPass 등 비밀번호 관리자 사용
```

#### 2. "App not signed" 에러

```bash
# android/app/build.gradle 확인
signingConfigs {
    release {
        keyAlias keystoreProperties['keyAlias']
        keyPassword keystoreProperties['keyPassword']
        storeFile file(keystoreProperties['storeFile'])
        storePassword keystoreProperties['storePassword']
    }
}

# key.properties 파일 존재 여부 확인
```

`android/key.properties`는 저장소에 커밋하지 않지만, 로컬 빌드 시에는 `storeFile=taco-release-key.keystore`, `keyAlias=taco-key`가 있어야 합니다.

#### 3. Build 실패

```bash
# Gradle 캐시 삭제
cd android
./gradlew clean

# 재빌드
./gradlew assembleRelease
```

### iOS 문제

#### 1. "No signing identity found" 에러

```bash
# Xcode → Settings → Accounts
# Apple ID 추가 및 Team 다운로드
```

#### 2. Provisioning Profile 에러

```bash
# Xcode → Product → Clean Build Folder (Cmd + Shift + K)
# Signing & Capabilities → Automatically manage signing 체크
```

#### 3. CocoaPods 에러

```bash
cd ios/App
pod deintegrate
pod install
```

#### 4. Archive 실패

```bash
# Build Settings에서 확인:
# - iOS Deployment Target: 13.0 이상
# - Valid Architectures: arm64

# Generic iOS Device 선택 확인
```

### 공통 문제

#### 1. 웹 변경사항이 반영 안 됨

```bash
# 캐시 삭제 후 재빌드
pnpm clean  # 있다면
pnpm build
pnpm cap:sync --force
```

#### 2. 네이티브 플러그인 오류

```bash
# Capacitor 재동기화
pnpm cap:sync
cd ios/App && pod install  # iOS만
```

---

## ✅ 배포 체크리스트

### 배포 전 확인사항

```
🔲 앱 아이콘 1024x1024px 준비
🔲 스크린샷 준비 (Android 최소 2개, iOS 최소 3개)
🔲 개인정보처리방침 URL 준비
🔲 앱 설명 작성 (짧은/긴 설명)
🔲 키워드 선정 (iOS 100자, Android 태그)
🔲 지원 URL 및 마케팅 URL 준비
🔲 버전 번호 확인 및 업데이트
🔲 변경사항 (Release Notes) 작성
🔲 모든 기기에서 테스트 완료
🔲 Keystore 백업 확인 (Android)
🔲 Apple Developer 계정 활성 확인 (iOS)
```

### Android 체크리스트

```
🔲 Keystore 파일 안전하게 보관
🔲 key.properties 파일 작성
🔲 .gitignore에 key.properties 추가
🔲 AAB 파일 생성 완료
🔲 Google Play Console 계정 확인
🔲 스토어 등록 정보 모두 입력
🔲 콘텐츠 등급 설문 완료
🔲 대상 고객 설정 완료
```

### iOS 체크리스트

```
🔲 Mac 컴퓨터 준비
🔲 Xcode 최신 버전 설치
🔲 Apple Developer 계정 활성 ($99 결제)
🔲 Bundle Identifier 등록
🔲 Build 번호 증가 확인
🔲 Archive 생성 성공
🔲 App Store Connect 업로드 완료
🔲 심사 정보 모두 입력
```

---

## 📞 추가 리소스

### 공식 문서

- [Capacitor 배포 가이드](https://capacitorjs.com/docs/deployment/app-store)
- [Google Play Console 도움말](https://support.google.com/googleplay/android-developer)
- [App Store Connect 도움말](https://developer.apple.com/help/app-store-connect/)

### 유용한 도구

- [App Icon Generator](https://appicon.co/) - 앱 아이콘 자동 생성
- [Screenshot Designer](https://www.figma.com/) - 스크린샷 디자인
- [ASO Tools](https://www.appannie.com/) - 앱 스토어 최적화

---

## 🎉 축하합니다!

앱 배포를 완료하셨습니다! 🚀

다음 단계:
1. 사용자 피드백 모니터링
2. 버그 리포트 확인
3. 정기적인 업데이트 배포
4. 리뷰 관리 및 응답

문제가 발생하면 이 문서를 참고하거나 공식 문서를 확인하세요!
