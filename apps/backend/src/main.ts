import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';
import * as Sentry from '@sentry/nestjs';
import { nodeProfilingIntegration } from '@sentry/profiling-node';

// Sentry 초기화 (최상단에서 실행)
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',

  // 성능 모니터링 샘플링 (10% - 무료 플랜 고려)
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  // Profiling 샘플링
  profilesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,

  integrations: [
    nodeProfilingIntegration(),
  ],

  // 민감정보 필터링
  beforeSend(event) {
    // Authorization 헤더 제거
    if (event.request?.headers) {
      delete event.request.headers['authorization'];
      delete event.request.headers['cookie'];
    }
    return event;
  },
});

// Express 인스턴스 생성 (Vercel Serverless용)
const expressApp = express();

// NestJS 앱 생성 및 초기화
let cachedApp: INestApplication | null = null;

async function bootstrap() {
    if (cachedApp) {
        return cachedApp;
    }

    const { AppModule } = await import('./app.module');

    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressApp),
        { logger: ['error', 'warn', 'log'] }
    );

    // Helmet.js 보안 헤더 설정
    // Scalar API 문서 UI가 cdn.jsdelivr.net을 사용하므로 CSP에 허용 추가
    app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net'],
                styleSrc: ["'self'", "'unsafe-inline'", 'cdn.jsdelivr.net', 'fonts.googleapis.com'],
                imgSrc: ["'self'", 'data:', 'cdn.jsdelivr.net'],
                connectSrc: ["'self'"],
                fontSrc: ["'self'", 'cdn.jsdelivr.net', 'fonts.gstatic.com'],
            },
        } : false,
        crossOriginEmbedderPolicy: false,
    }));

    // Global Validation Pipe
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true, // DTO에 없는 속성 제거
            transform: true, // 타입 자동 변환
            forbidNonWhitelisted: true, // DTO에 없는 속성 있으면 에러
        }),
    );

    // Global Exception Filter
    app.useGlobalFilters(new HttpExceptionFilter());

    // Global Response Interceptor
    app.useGlobalInterceptors(new TransformInterceptor());

    // Swagger Setup
    const config = new DocumentBuilder()
        .setTitle('🌮 Taco Mono API')
        .setDescription(`
## 배달앱 · 테이블오더 통합 주문 API

### 채널별 주문 흐름
- **배달앱 (DELIVERY_APP)**: 로그인 필수 → Toss 선결제 → PAID 확정 → MQ 처리. 홈페이지의 주문 CTA도 배달앱으로 리다이렉트되어 동일한 흐름을 따른다.
- **테이블오더 (TABLE_ORDER)**: QR 세션 기반 → 테이블별 첫 주문/추가 주문
- **POS 연동**: PAID 주문을 POS 플러그인이 polling 수신

### 인증
Supabase JWT를 Bearer Token으로 전달합니다.
\`Authorization: Bearer <supabase_jwt>\`

### Base URL
- Development: http://localhost:4000/api/v1
- Production: https://api.tacomole.kr/api/v1
        `)
        .setVersion('1.0.0')
        .setContact(
            'Order System Support',
            'https://github.com/your-repo',
            'support@ordersystem.com'
        )
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addServer('http://localhost:4000', 'Development Server')
        .addServer('https://api.tacomole.kr', 'Production Server')
        .addBearerAuth(
            {
                type: 'http',
                scheme: 'bearer',
                bearerFormat: 'JWT',
                name: 'JWT',
                description: 'Enter JWT token',
                in: 'header',
            },
            'JWT-auth',
        )
        .addTag('Stores', '매장 관리 API')
        .addTag('Menus', '메뉴 조회/관리 API')
        .addTag('Orders', '주문 관리 API')
        .addTag('Payments', 'Toss 결제 승인/취소/환불 API')
        .addTag('Auth', '인증 및 사용자 동기화 API')
        .addTag('Users', '사용자 주소/찜 관리 API')
        .addTag('Sessions', '테이블 세션 API')
        .addTag('Queue', '내부 큐 처리 API')
        .addTag('Queue Operations', 'MQ 운영 관리 API')
        .addTag('Integrations', 'Toss POS 메뉴 동기화 API')
        .addTag('POS Integration', 'POS 플러그인 연동 API')
        .addTag('Error Logs', '에러 로깅 API')
        .build();

    const document = SwaggerModule.createDocument(app, config);

    // Scalar API 문서 UI를 CDN으로 직접 임베딩.
    // @scalar/nestjs-api-reference 패키지는 ESM/CommonJS 호환성 이슈로 Vercel 서버리스에서 ERR_REQUIRE_ESM 발생.
    // → HTML에서 CDN 스크립트만 로드하면 서버 측 import 자체가 없어서 문제 회피.
    const scalarHtml = `<!DOCTYPE html>
<html>
  <head>
    <title>🌮 Taco Mono API Docs</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
  </head>
  <body>
    <script
      id="api-reference"
      data-url="/api/docs-json"
      data-configuration='{"theme":"purple","defaultHttpClient":{"targetKey":"javascript","clientKey":"fetch"}}'
    ></script>
    <script src="https://cdn.jsdelivr.net/npm/@scalar/api-reference"></script>
  </body>
</html>`;

    // SwaggerModule.setup 전에 등록해야 우선 적용됨
    expressApp.get('/api/docs', (_req, res) => {
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(scalarHtml);
    });

    // OpenAPI 스펙 JSON 엔드포인트만 활용 (/api/docs-json)
    SwaggerModule.setup('api/docs', app, document, {
        jsonDocumentUrl: 'api/docs-json',
    });

    // CORS 설정 (환경별 분리)
    // 운영 도메인: tacomole.kr (브랜드), www.tacomole.kr, admin.tacomole.kr, delivery.tacomole.kr, order.tacomole.kr
    // FRONTEND_URLS 환경변수(콤마 구분)로 추가/override 가능. 기존 FRONTEND_URL 단일 값도 호환 유지.
    const PRODUCTION_DEFAULT_ORIGINS = [
        'https://tacomole.kr',
        'https://www.tacomole.kr',
        'https://admin.tacomole.kr',
        'https://delivery.tacomole.kr',
        'https://order.tacomole.kr',
        // Capacitor 네이티브 WebView (server.url 미설정 시 기본 origin)
        'capacitor://localhost',
        'http://localhost',
        'https://localhost',
    ];
    const envOrigins = [
        process.env.FRONTEND_URL,
        ...(process.env.FRONTEND_URLS?.split(',') ?? []),
    ]
        .map((o) => o?.trim())
        .filter((o): o is string => Boolean(o));

    const allowedOrigins = process.env.NODE_ENV === 'production'
        ? Array.from(new Set([...PRODUCTION_DEFAULT_ORIGINS, ...envOrigins]))
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003'];

    app.enableCors({
        origin: (origin, callback) => {
            // origin이 없는 경우 (모바일 앱 일부, Postman, 같은 origin 요청 등) 허용
            if (!origin) return callback(null, true);

            if (process.env.NODE_ENV === 'development') {
                return callback(null, true);
            }

            if (allowedOrigins.includes(origin)) {
                return callback(null, true);
            }

            return callback(new Error(`Not allowed by CORS: ${origin}`));
        },
        methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE', 'OPTIONS'],
        credentials: true,
        allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'x-pos-api-key', 'Idempotency-Key', 'x-internal-secret'],
        exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
        maxAge: 3600, // preflight 캐싱 1시간
    });

    // Global Prefix 설정 (AppController는 제외)
    app.setGlobalPrefix('api/v1', {
        exclude: ['/'],
    });

    // Vercel 환경에서는 초기화만
    await app.init();

    cachedApp = app;
    return app;
}

// Vercel Serverless Functions용 export
export default async (req: any, res: any) => {
    if (req.url === '/health' || req.url === '/api/v1/health') {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.status(200).json({
            status: 'ok',
            timestamp: new Date().toISOString(),
            version: '0.0.2',
            runtime: 'vercel-fast-path',
        });
        return;
    }

    await bootstrap();
    return expressApp(req, res);
};

// 로컬 개발 환경
if (!process.env.VERCEL) {
    bootstrap().then((app) => {
        const port = process.env.PORT || 4000;
        app.listen(port);
        console.log(`Application is running on: http://localhost:${port}`);
    });
}
