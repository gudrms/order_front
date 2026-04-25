# Table Order PWA 배포 체크리스트

마지막 업데이트: 2026-04-25

## 현재 판단

- 목적: 테이블 QR 주문을 모바일 브라우저/PWA 환경에서 안정적으로 실행.
- 현재 상태: 로컬 PWA 구성은 존재하나 실제 배포/기기 검증은 더 필요함.
- 가장 큰 남은 일: 프로덕션 HTTPS, QR 배포, 실제 모바일 기기 검증.

## 로컬 확인

- [x] `manifest.json` 경로 확인
- [x] 아이콘 asset 구성 확인
- [x] Service Worker 구조 존재
- [x] standalone 모드 대응 구조 존재
- [x] 테이블 QR 진입 경로 존재

## 프로덕션 배포 전 필수

- [ ] HTTPS 적용 확인
- [ ] 실제 도메인 연결 확인
- [ ] QR 코드 URL이 프로덕션 도메인을 바라보는지 확인
- [ ] Store Context가 프로덕션 매장 URL에서 정상 동작하는지 확인
- [ ] Service Worker 캐시가 메뉴/주문 API를 과하게 캐싱하지 않는지 확인
- [ ] 주문 생성 API는 항상 network-first 또는 no-store 정책 적용
- [ ] 결제/주문 상태 API는 캐시 제외

## 기기 테스트

- [ ] Android Chrome에서 QR 진입 테스트
- [ ] iOS Safari에서 QR 진입 테스트
- [ ] 홈 화면 추가 테스트
- [ ] standalone 모드에서 주문 생성 테스트
- [ ] 네트워크 끊김/복구 시 동작 확인
- [ ] 작은 화면/큰 화면 viewport 확인
- [ ] 테이블에서 여러 명 동시 주문 테스트

## 운영 체크

- [ ] 관리자에서 테이블 QR 재생성 가능
- [ ] QR 인쇄물에 매장/테이블 식별 정보 포함
- [ ] 폐기된 QR 접근 차단 정책 결정
- [ ] 매장 비활성/영업 종료 시 안내 화면 표시
- [ ] 장애 시 직원 호출/카운터 주문 안내 fallback 제공

## 성능/품질

- [ ] Lighthouse PWA 점수 90+ 확인
- [ ] Lighthouse 접근성 90+ 확인
- [ ] 초기 로딩 3초 이내 목표 확인
- [ ] 메뉴 이미지 lazy loading 확인
- [ ] Sentry 오류 수집 확인

## 다음 개발 순서

1. 프로덕션 URL 기준 QR 생성/진입 테스트
2. 주문 API 캐싱 제외 확인
3. Android/iOS 실제 기기 테스트
4. Lighthouse 점검
5. 관리자 QR 인쇄 흐름과 연결
