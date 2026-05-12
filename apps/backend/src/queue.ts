// Separate Vercel entrypoint for internal queue processing routes.
// Uses a slim module (QueueAppModule) that skips HTTP-facing modules
// not needed for queue processing, reducing cold start time.
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import type { INestApplication } from '@nestjs/common';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { QueueAppModule } from './queue-app.module';
import express from 'express';

const expressApp = express();
let cachedApp: INestApplication | null = null;

async function bootstrapQueue() {
    if (cachedApp) {
        return cachedApp;
    }

    const app = await NestFactory.create(
        QueueAppModule,
        new ExpressAdapter(expressApp),
        { logger: ['error', 'warn', 'log'] },
    );

    app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: true }),
    );
    app.useGlobalFilters(new HttpExceptionFilter());

    app.setGlobalPrefix('api/v1');

    await app.init();

    cachedApp = app;
    return app;
}

export default async (req: any, res: any) => {
    await bootstrapQueue();
    return expressApp(req, res);
};
