# 🍽️ m-오더 (Mobile Order System) - Monorepo

**m-오더**는 음식점에서 사용하는 태블릿 기반 주문 시스템입니다. 이 저장소는 프론트엔드(Next.js)와 백엔드(NestJS)를 포함하는 모노레포(Monorepo)로 구성되어 있습니다.

---

## 📁 프로젝트 구조

```
/
├── apps/
│   ├── frontend/        # 고객용/관리자용 웹 애플리케이션 (Next.js 14)
│   └── backend/         # API 서버 (NestJS 10)
├── docs/                # 프로젝트 문서 및 참고 자료
└── package.json         # Root 설정 (Workspaces)
```

---

## 🚀 시작 가이드 (Getting Started)

### 1️⃣ 설치 (Installation)

루트 디렉토리에서 모든 의존성을 한 번에 설치합니다.

```bash
npm install
```

### 2️⃣ 실행 (Run)

**프론트엔드 실행:**

```bash
npm run dev -w frontend
# 또는
npm run dev
```

**백엔드 실행:**

```bash
npm run start:dev -w backend
```

---

## 📚 문서 (Documentation)

- [Frontend README](./apps/frontend/README.md)
- [Backend README](./apps/backend/README.md) (작성 예정)
- [기술 명세서 (Tech Spec)](./docs/tech_spec.md)
