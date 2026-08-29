# 토스페이먼츠 전자결제(PG) 심사 · 연동 문서

> 최종 갱신: 2026-08-29

배달앱(`apps/delivery-customer`)에 토스페이먼츠 결제위젯을 직접 연동하고, PG 카드사 심사를
진행 중이다. 이 문서는 심사 대응 내용 · 키 구성 · 환경변수 · 배포 절차를 정리한다.

---

## 1. 계약 정보

| 항목 | 값 |
|---|---|
| 상호(법인) | 주식회사 에스와이월드 |
| 대표자 | 이윤수 |
| 사업자등록번호 | 179-88-02490 |
| 법인등록번호 | 124411-0312091 *(웹/PG에는 표기하지 않음)* |
| 사업장 주소 | 인천광역시 서구 보듬로 158, 2층 202호 (오류동, 블루빌) |
| 개업일 | 2021.10.26 |
| 업태/종목 | 전자·전기·과학 및 기술서비스업 / 경영 컨설팅업, 도매 및 소매업 / 과자류·당류 소매업 |
| 상점아이디(MID) | `tacomom5cx` |
| 신청 결제수단 | 기본(신용카드, 계좌이체, 휴대폰결제) + 간편결제 |
| 고객센터 | 010-4593-0731 |
| 통신판매업신고번호 | 제2026-인천서구-2059호 |
| 이메일 | tacomole26@gmail.com |

### 미확보 / TODO
- **업태에 음식점업/통신판매업 추가** 권장 (판매 상품과 업태 불일치 지적 가능).
- 계약 완료 후 **live 키 교체** (아래 3절).
- **결제경로 PPT** 제작 (상품선택 → 장바구니 → 주문서 → 결제창 → 완료 화면 캡처).

---

## 2. 토스 심사 이메일 (수신) — 필수 대응 항목

토스페이먼츠 계약 담당자로부터 받은 심사 안내 메일 요약.

### 심사 일정
- 서류 심사: 영업일 3~5일
- 카드사 심사: 계약 완료 후 7~14영업일
- 미회신 1개월 초과 시 신청 취소 → 재신청 필요

### 1. 계약심사 필수질문 (메일 회신)
1. 판매 상품/서비스
   - ① 결제 상품/서비스 확인 가능한 URL
   - ② 환불 정책 확인 가능한 URL
   - ③ 결제 상품/서비스 상세 내용
   - ④ 단건 결제 기준 상품 금액 최고가
   - (비회원 구매 불가 시) 테스트계정 ID/PW — **소셜 로그인 불가**
2. 결제 시점부터 서비스 제공 종료까지 최대 서비스제공기간
   - 배송 6주 초과 시 입점 불가 / 서비스 12개월 초과 시 입점 불가 / 6개월 초과 시 가상계좌 불가
   - 구매자가 배송기간을 인지하도록 상품 페이지에 명확히 기재
3. 앱 서비스면 앱 다운로드 링크 (미등록이면 그 사실 안내)
4. 결제모듈 직접 연동 여부 (Y/N) — 호스팅사 이용 시 호스팅사명

### 2. 카드사 심사용 홈페이지 준비사항
1. 결제 가능한 실제 판매 상품 1개 이상 (테스트 상품 불가)
2. 홈페이지 하단 사업자정보: 상호 / 대표자 / 사업자등록번호 / 사업장 주소(층·호) / 유선번호
   (070·0505·대표번호·080·휴대폰 가능) — **사업자등록증과 완전 일치**
3. 결제창 연동
4. 결제경로 파일(PPT) 첨부 — 예시파일과 동일 구성

> 계약 외 문의: 1544-7772

---

## 3. 회신 내용 (제출용 초안)

`[ ]` 는 발송 전 확인 필요 항목.

```
안녕하세요. 상점아이디(MID) tacomom5cx / 상호 에스와이월드 건으로 회신드립니다.

1. 계약심사 필수질문

1) 판매 상품/서비스
① 결제 상품/서비스 확인 가능한 URL: https://delivery.tacomole.kr → 매장 선택 → 메뉴 담기 → 결제
② 환불 정책 확인 가능한 URL: https://delivery.tacomole.kr/refund-policy
③ 상세 내용: 타코몰리(TACO MOLE) 브랜드의 멕시칸 음식(타코·부리또·퀘사디아·사이드·음료·세트메뉴)을
   자체 개발한 배달 주문 앱으로 주문받아, 매장에서 조리 후 배달하는 음식 배달 서비스입니다.
   결제 즉시 조리를 시작하며 주문 당일 배달 완료됩니다.
④ 단건 결제 기준 상품 금액 최고가: [최고가 메뉴/세트 금액]원
비회원 구매: 불가 → 테스트 계정 ID: test@test.com / PW: 1234 (소셜 로그인 아님, 이메일 로그인)

2) 최대 서비스제공기간
① 최대 제공기간: 결제 후 당일(수 시간 이내) 조리·배달 완료 — 최대 1일.
   매장별 예상 배달 소요 시간은 메뉴·결제 페이지에 안내하고 있습니다.

3) 앱 서비스
Android: https://play.google.com/store/apps/details?id=com.tacomole.app
iOS: [App Store Connect에서 Apple ID(숫자) 확인 후 https://apps.apple.com/kr/app/id{숫자}]
(iOS 미출시 시: 현재 App Store 심사 준비 중이며, 웹(PWA) https://delivery.tacomole.kr 에서
 동일 서비스 이용 가능합니다. 등록 완료 시 링크 회신드리겠습니다.)

4) 결제모듈 직접 연동 여부: Y (직접 연동)
자체 개발한 Next.js 기반 주문 앱에 토스페이먼츠 결제위젯 SDK(@tosspayments/payment-widget-sdk)를
직접 연동했습니다. 카페24·아임웹·포트원 등 호스팅사/대행 솔루션은 사용하지 않습니다.

2. 카드사 심사용 홈페이지 준비사항
1) 홈페이지에 실제 판매 중인 메뉴가 등록되어 있으며 실제 결제가 가능합니다.
2) 홈페이지 하단에 사업자정보를 기재했습니다 (사업자등록증과 동일):
 - 상호: 주식회사 에스와이월드
 - 대표자: 이윤수
 - 사업자등록번호: 179-88-02490
 - 사업장 주소: 인천광역시 서구 보듬로 158, 2층 202호 (오류동, 블루빌)
 - 유선번호: 010-4593-0731
 - 통신판매업신고번호: 제2026-인천서구-2059호
3) 결제창(토스페이먼츠 결제위젯) 연동을 완료했습니다.
4) 이용약관: https://delivery.tacomole.kr/terms
   취소·환불 정책: https://delivery.tacomole.kr/refund-policy
5) 결제경로 파일(PPT)은 별도 첨부합니다.

감사합니다.
```

발송 전 채울 것: ④ 최고가 금액 / 앱 스토어 링크 / 결제경로 PPT 첨부.

---

## 4. 결제 키 구성

### 4-1. 키 종류 (혼동 주의)

| 구분 | 사이트 | 키 형식 | 이 저장소에서 |
|---|---|---|---|
| **토스페이먼츠** (온라인 PG) | developers.tosspayments.com | 클라이언트 `test_gck_`/`live_gck_`, 시크릿 `test_gsk_`/`live_gsk_` (주문서형·결제창형 = 구 결제위젯) | `delivery-customer`, `table-order` |
| 토스페이먼츠 API 개별연동 | 〃 | `test_ck_`/`live_ck_`, `test_sk_`/`live_sk_` | **이 코드에서 사용 안 함** (프론트 검사가 `_gck_`만 통과) |
| 토스플레이스 (오프라인 POS) | 개발자센터 별도 | Access Key `AKO...` / Access Secret | `apps/toss-pos-plugin` |

프론트 검사: `apps/delivery-customer/.../checkout/page.tsx` 의 `isTossWidgetClientKey`
→ `test_gck_` / `live_gck_` 접두사만 통과. 아니면 "결제 설정이 준비되지 않았습니다" 표시 + 결제버튼 비활성.

### 4-2. 현재 값 (계약 전 임시 — 토스 docs 예제 키)

| 위치 | 환경변수 | 값 |
|---|---|---|
| Vercel `order-delivery` | `NEXT_PUBLIC_TOSS_CLIENT_KEY` | `test_gck_docs_Ovk5rk1EwkEbP0W43n07xlzm` |
| Vercel `order-front-backend` | `TOSS_PAYMENTS_SECRET_KEY` | `test_gsk_docs_OaPz8L5KdmQXkzRz3y47BMw6` |

- docs 키는 실제 동작(테스트 모드) — 결제창 뜨고 테스트 승인됨. **실제 청구 없음.**
- 클라이언트/시크릿은 **같은 상점(둘 다 docs)** 이어야 승인까지 완료됨. 불일치 시
  "결제는 완료되었지만 주문 승인 처리 중 오류".
- 백엔드 시크릿 해석 순서: `TOSS_PAYMENTS_SECRET_KEY` → `TOSS_SECRET_KEY` → `TOSS_ACCESS_SECRET`
  (`apps/backend/src/modules/integrations/toss/toss-api.service.ts`).

### 4-3. 계약 완료 후 교체

1. 개발자센터에서 상점 선택을 "개발 연동 체험 상점" → 본인 상점(tacomom5cx)으로 변경
2. `order-delivery` `NEXT_PUBLIC_TOSS_CLIENT_KEY` → `live_gck_...` (본인 상점)
3. `order-front-backend` `TOSS_PAYMENTS_SECRET_KEY` → `live_gsk_...` (본인 상점)
4. 각 프로젝트 재배포

---

## 5. Vercel 환경변수 체크리스트

### `order-delivery` (배달앱)
| 변수 | 값 | 비고 |
|---|---|---|
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | `test_gck_docs_...` → `live_gck_...` | **빌드 시점에 박힘**. 변경 시 캐시 끄고 재배포 |
| `DELIVERY_REVALIDATE_SECRET` | (백엔드와 동일한 문자열) | 관리자 변경 즉시 반영용 |

### `order-front-backend` (백엔드)
| 변수 | 값 | 비고 |
|---|---|---|
| `TOSS_PAYMENTS_SECRET_KEY` | `test_gsk_docs_...` → `live_gsk_...` | 결제 승인. 런타임 env(재배포만 하면 반영) |
| `TOSS_ACCESS_KEY` | `AKO...` (토스플레이스) | 부팅 필수(Joi 검증) — 이미 설정됨 |
| `DELIVERY_REVALIDATE_URL` | `https://delivery.tacomole.kr/api/revalidate` | 미설정 시 관리자 메뉴 변경이 최대 5분 지연 |
| `DELIVERY_REVALIDATE_SECRET` | (order-delivery와 동일) | 〃 |

### `order-website` (브랜드)
| 변수 | 값 |
|---|---|
| `NEXT_PUBLIC_TOSS_CLIENT_KEY` | 결제 없음 — 불필요 |

---

## 6. 배포 절차

- 브랜치: `dev`에서 작업 → `dev` → `master` PR 머지 → Vercel이 `master` 기준 프로덕션 배포.
- **프론트 파일만 바뀐 PR은 `order-front-backend`가 배포되지 않음** (Ignored Build Step).
  백엔드 env를 반영하려면 백엔드 파일을 건드리는 커밋을 포함하거나, Vercel에서 수동 Redeploy.
- **`NEXT_PUBLIC_*` 변경 시**: env 저장 후 Deployments → 최신 Production → ⋯ → Redeploy →
  **"Use existing Build Cache" 해제** → Redeploy. (캐시된 빌드는 옛 값을 그대로 유지함)
- 배포된 빌드에 박힌 키 확인: 브라우저 콘솔에
  `[checkout] NEXT_PUBLIC_TOSS_CLIENT_KEY 가 결제위젯 키가 아닙니다. prefix=...` 경고가 뜨는지 확인.

---

## 7. 심사 대응으로 추가/수정한 코드

| 커밋 | 내용 |
|---|---|
| `51ae41b` | `@order/shared` 사업자정보/약관 공용 상수, `@order/ui` `PolicyPage` 컴포넌트 |
| `2ed9fec` | delivery: `SiteFooter`(하단 사업자정보), `/terms`, `/refund-policy`, 배달 소요기간 안내, 결제 페이지 약관 동의 문구 |
| `ae0eabe` | brand-website: Footer 사업자정보, `/terms`, `/refund-policy` |
| `c067430` | delivery: 하단 사업자정보 접이식(details) 처리 |
| `829f965` | delivery: 결제위젯 키 오구성 시 콘솔 경고 |
| `a3e5ba3` | delivery: 이메일/비밀번호 로그인 추가 (심사 테스트 계정용) |
| `a207bbf` | backend: `DELIVERY_REVALIDATE_*` 미설정 시 경고 로그 |
| `898a27d` | delivery: 주문내역을 매장 선택 없이 조회(홈 탭에서 도달 불가하던 버그) |
| `944a860` | delivery: 결제 수령인 정보 프로필 fallback(전화번호 빈칸 버그) |

### 관련 소스
- 사업자정보 단일 소스: `packages/shared/src/constants/company.ts`
- 약관/환불정책 본문: `packages/shared/src/constants/legal.ts`
- 정책 페이지 레이아웃: `packages/ui/src/components/legal/PolicyPage.tsx`
- 배달앱 푸터: `apps/delivery-customer/src/components/SiteFooter.tsx`
- 결제/체크아웃: `apps/delivery-customer/src/app/store/[storeId]/order/checkout/page.tsx`
- 백엔드 결제 승인: `apps/backend/src/modules/payments/payments.service.ts`,
  `apps/backend/src/modules/integrations/toss/toss-api.service.ts`
- 배달앱 캐시 무효화: `apps/backend/src/common/utils/delivery-cache.ts`,
  `apps/delivery-customer/src/app/api/revalidate/route.ts`

---

## 8. 심사용 테스트 계정

| 항목 | 값 |
|---|---|
| ID | `test@test.com` |
| PW | `1234` |

- Supabase Auth에서 생성. `https://delivery.tacomole.kr/login` 하단 **"이메일로 로그인"** 토글로 사용.
- 기존 카카오/Apple 로그인은 그대로 유지. 이메일 로그인만 추가함.
- ※ Supabase 비밀번호 최소 길이 정책이 6자면 `1234`로 로그인 실패 → 6자 이상으로 재생성 필요.

---

## 9. 프로덕션 URL

| 용도 | URL |
|---|---|
| 배달앱 | https://delivery.tacomole.kr |
| 이용약관 | https://delivery.tacomole.kr/terms |
| 취소·환불 정책 | https://delivery.tacomole.kr/refund-policy |
| 브랜드 사이트 | https://www.tacomole.kr |
| 브랜드 이용약관 / 환불정책 | https://www.tacomole.kr/terms , /refund-policy |
| 개인정보처리방침 | https://www.tacomole.kr/privacy |
| API | https://api.tacomole.kr |
| Google Play (Android) | https://play.google.com/store/apps/details?id=com.tacomole.app |
| App Store (iOS) | App Store Connect에서 Apple ID 확인 필요 (bundle id: `com.taco.delivery`) |
| 토스페이먼츠 개발자센터 | https://developers.tosspayments.com |

## 10. 결제경로 파일(PPT)

카드사 심사 제출용. 별도 문서 참조: [`결제경로_PPT_초안.md`](./결제경로_PPT_초안.md)
(토스 원본 가이드: `토스페이먼츠_APP_결제경로_제작_가이드.pdf`)
