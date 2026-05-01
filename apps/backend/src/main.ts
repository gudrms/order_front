import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';
import { ValidationPipe } from '@nestjs/common';
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
let cachedApp: any = null;

async function bootstrap() {
    if (cachedApp) {
        return cachedApp;
    }

    const app = await NestFactory.create(
        AppModule,
        new ExpressAdapter(expressApp),
        { logger: ['error', 'warn', 'log'] }
    );

    // Helmet.js 보안 헤더 설정
    app.use(helmet({
        contentSecurityPolicy: process.env.NODE_ENV === 'production' ? undefined : false,
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
## 배달앱 · 테이블오더 · 홈페이지 통합 주문 API

### 채널별 주문 흐름
- **배달앱 (DELIVERY_APP)**: 로그인 필수 → Toss 선결제 → PAID 확정 → MQ 처리
- **테이블오더 (TABLE_ORDER)**: QR 세션 기반 → 테이블별 첫 주문/추가 주문
- **홈페이지 (HOMEPAGE)**: 직접 주문 → Toss 결제 → MQ worker 후처리
- **POS 연동**: PAID 주문을 POS 플러그인이 polling 수신

### 인증
Supabase JWT를 Bearer Token으로 전달합니다.
\`Authorization: Bearer <supabase_jwt>\`

### Base URL
- Development: http://localhost:4000/api/v1
- Production: https://order-front-backend.vercel.app/api/v1
        `)
        .setVersion('1.0.0')
        .setContact(
            'Order System Support',
            'https://github.com/your-repo',
            'support@ordersystem.com'
        )
        .setLicense('MIT', 'https://opensource.org/licenses/MIT')
        .addServer('http://localhost:4000', 'Development Server')
        .addServer('https://order-front-backend.vercel.app', 'Production Server')
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
    SwaggerModule.setup('api/docs', app, document, {
        customSiteTitle: 'Order System API Docs',
        customfavIcon: 'https://nestjs.com/img/logo_text.svg',
        customCss: '.swagger-ui .topbar { display: none }',
        swaggerOptions: {
            persistAuthorization: true,
            tagsSorter: 'alpha',
            operationsSorter: 'alpha',
        },
    });

    // CORS 설정 (환경별 분리)
    const allowedOrigins = process.env.NODE_ENV === 'production'
        ? [
            process.env.FRONTEND_URL || 'https://order-front-frontend.vercel.app',
            // 추가 도메인이 있다면 여기에 추가
        ]
        : ['http://localhost:3000', 'http://localhost:3001', 'http://localhost:3002', 'http://localhost:3003']; // 개발 환경

    app.enableCors({
        origin: (origin, callback) => {
            // origin이 없는 경우 (모바일 앱, Postman 등) 허용
            if (!origin) return callback(null, true);

            if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
                callback(null, true);
            } else {
                callback(new Error('Not allowed by CORS'));
            }
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
