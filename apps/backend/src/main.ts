import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);

    // CORS 설정 (프론트엔드 연동을 위해 필수)
    app.enableCors({
        origin: true, // 개발 중에는 모든 origin 허용
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });

    // Global Prefix 설정
    app.setGlobalPrefix('api/v1');

    // Vercel 환경인지 확인
    if (process.env.VERCEL) {
        await app.init();
    } else {
        await app.listen(3001);
        console.log(`Application is running on: ${await app.getUrl()}`);
    }
}
bootstrap();
