# 🛠️ Technical Specification (Tech Spec)

## 1. Architecture Overview
본 프로젝트는 **Frontend(Next.js)**와 **Backend(Spring Boot)**가 분리된 구조입니다.
인프라는 **Naver Cloud Platform (NCP)**을 사용하여 구축합니다.

## 2. Technology Stack

### 2.1 Frontend (Web/Tablet)
- **Framework**: Next.js 14+ (App Router)
- **Language**: TypeScript
- **Styling**: TailwindCSS
- **State Management**: Zustand (Client State), TanStack Query (Server State)
- **Package Manager**: npm or pnpm

### 2.2 Backend (API Server)
- **Framework**: Spring Boot 3.x
- **Language**: Java 17+
- **Build Tool**: Gradle
- **Database Access**: Spring Data JPA, QueryDSL
- **Real-time**: Spring WebSocket (STOMP)
- **API Docs**: Swagger (SpringDoc)
- **External API**: OKPOS O2O API (dum.okpos.co.kr)
- **Resilience**: Spring Retry, Resilience4j Circuit Breaker
- **HTTP Client**: RestTemplate

### 2.3 Database
- **RDBMS**: PostgreSQL 14+ (Naver Cloud 'Cloud DB for PostgreSQL' 권장)
    - **이유**:
        - **JSONB**: 메뉴 옵션 등 비정형 데이터 처리에 최적화됨.
        - **관리형 서비스(Cloud DB)**:
            - **자동 백업**: 데이터 유실 걱정 없음 (매일 자동 백업).
            - **모니터링**: 쿼리 성능, 디스크 사용량 등을 그래프로 확인 가능.
            - **고가용성(HA)**: 서버 장애 시 자동으로 예비 서버로 교체되어 서비스 중단 최소화.

## 3. Infrastructure (Naver Cloud Platform)

### 3.1 Compute (Server)
- **Server**: Standard-g2 (vCPU 2, Mem 4GB) - 백엔드 서버용
    - OS: Ubuntu 22.04 LTS or Rocky Linux
- **Public IP**: 외부 접속을 위한 공인 IP 할당

### 3.2 Storage
- **Object Storage**: 메뉴 이미지, 로고 등 정적 파일 저장소 (S3 호환)
- **NAS** (Optional): 로그 파일 공유 등이 필요할 경우 사용

### 3.3 Network & Security
- **VPC**: 격리된 네트워크 환경 구성
- **ACG (Access Control Group)**: 방화벽 설정
    - Inbound: 80(HTTP), 443(HTTPS), 22(SSH - 관리자만), 8080(WAS)
- **Global DNS**: 도메인 관리

### 3.4 CI/CD (Deployment)
- **GitHub Actions**: 코드 푸시 시 자동 빌드 및 배포
    - **Frontend**: 빌드 후 NCP Object Storage(정적 호스팅) 또는 Server에 배포
    - **Backend**: Gradle Build -> JAR 파일 생성 -> NCP Server로 전송 및 실행 (SCP/SSH)

## 4. Development Environment
- **IDE**: IntelliJ IDEA (Backend), WebStorm (Frontend)
- **API Test**: Postman or https
- **Design**: Figma
