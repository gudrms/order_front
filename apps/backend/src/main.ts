import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import express from 'express';

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

    // CORS 설정 (프론트엔드 연동을 위해 필수)
    app.enableCors({
        origin: true, // 개발 중에는 모든 origin 허용
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
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
        const port = process.env.PORT || 3001;
        app.listen(port);
        console.log(`Application is running on: http://localhost:${port}`);
    });
}
