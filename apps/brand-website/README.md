# Brand Website

브랜드 소개, 메뉴, 매장 위치, 창업 문의, 개인정보처리방침을 제공하는 Next.js 브랜드 홈페이지입니다.
## 기술 스택

- **Framework**: Next.js 16 (App Router)
- **Rendering**: App Router 기반 정적/서버 렌더링 혼합
- **Styling**: TailwindCSS 4
- **SEO**: Metadata, Open Graph, Sitemap, Robots 구성
- **Monitoring**: Sentry

## 개발 서버 실행

```bash
pnpm --filter brand-website dev
```

포트: http://localhost:3002

## 주요 기능

- 브랜드 소개
- 메뉴 소개
- 매장 위치
- 창업 문의
- 개인정보처리방침

## 배포

Vercel에 배포합니다.

```bash
pnpm --filter brand-website build
```
