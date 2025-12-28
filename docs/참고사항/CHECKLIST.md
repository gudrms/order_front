# 📋 Table Order System Project Checklist

## 1. 📅 기획 (Planning) - [완료]
- [x] 요구사항 정의 (Requirements)
- [x] 기술 스택 선정 (Tech Stack)
- [x] 데이터베이스 설계 (ERD)
- [x] 화면 설계 (Wireframes)
- [x] API 명세서 작성 (API Spec)

## 2. 🎨 디자인 (Design)
- [ ] 디자인 시스템 구축 (Color, Font, Component)
- [ ] UI 디자인 (Figma 등 활용)
- [ ] 아이콘 및 이미지 리소스 준비

## 3. 💻 개발 (Development)

### 3.1 Frontend - Customer Tablet (Next.js)
- [ ] **기본 설정**
    - [ ] Next.js 프로젝트 생성 및 Tailwind 설정
    - [ ] 폰트 및 컬러 팔레트 적용 (다크 모드)
- [ ] **메인 화면 (Menu Board)**
    - [ ] 카테고리 사이드바 구현
    - [ ] 메뉴 리스트 그리드 구현
    - [ ] 메뉴 상세 모달 (옵션/수량 선택)
- [ ] **주문 기능**
    - [ ] 장바구니 상태 관리 (Zustand)
    - [ ] 장바구니 드로어/모달 UI
    - [ ] 주문 전송 API 연동 (Mocking)
- [ ] **유틸리티**
    - [ ] 직원 호출 기능
    - [ ] 주문 내역 조회 화면

### 3.2 Frontend - Admin Dashboard (Next.js)
- [ ] **주문 접수 (Kitchen/POS)**
    - [ ] 실시간 주문 알림 (WebSocket Mocking)
    - [ ] 주문 상태 변경 (접수/조리/완료)
    - [ ] 알림 사운드 재생 기능
- [ ] **매장 관리**
    - [ ] 메뉴 등록/수정/삭제 (이미지 업로드)
    - [ ] 테이블 QR 코드 생성 및 관리
    - [ ] 매출 통계 차트 (Recharts)

### 3.3 Backend (Spring Boot)
- [ ] 프로젝트 초기 설정 (Spring Initializr)
- [ ] 데이터베이스 연동 (JPA/Hibernate)
- [ ] API 구현 (Controller, Service, Repository)
    - [ ] 매장/테이블 관리 API
    - [ ] 메뉴/카테고리 관리 API
    - [ ] 주문 처리 API
- [ ] 실시간 통신 구현 (WebSocket/STOMP)
- [ ] 관리자 기능 구현
- [ ] API 문서화 (Swagger/RestDocs)

## 4. 🧪 테스트 (Testing)
- [ ] 단위 테스트 (Unit Test)
- [ ] 통합 테스트 (Integration Test)
- [ ] 사용자 인수 테스트 (UAT) - 태블릿/모바일 환경 테스트

## 5. 🚀 배포 (Deployment)
- [ ] 서버 환경 구축 (Naver Cloud Platform)
- [ ] CI/CD 파이프라인 구성 (GitHub Actions)
- [ ] 도메인 연결 및 SSL 인증서 적용 (HTTPS)

## 6. 📈 운영 및 유지보수 (Operation)
- [ ] 모니터링 시스템 구축 (Logging, Monitoring)
- [ ] 사용자 피드백 수집 및 분석
- [ ] 버그 수정 및 기능 고도화