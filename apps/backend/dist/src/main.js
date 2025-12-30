"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const platform_express_1 = require("@nestjs/platform-express");
const app_module_1 = require("./app.module");
const express = require("express");
const expressApp = express();
let cachedApp = null;
async function bootstrap() {
    if (cachedApp) {
        return cachedApp;
    }
    const app = await core_1.NestFactory.create(app_module_1.AppModule, new platform_express_1.ExpressAdapter(expressApp), { logger: ['error', 'warn', 'log'] });
    app.enableCors({
        origin: true,
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
    });
    app.setGlobalPrefix('api/v1');
    await app.init();
    cachedApp = app;
    return app;
}
exports.default = async (req, res) => {
    await bootstrap();
    return expressApp(req, res);
};
if (!process.env.VERCEL) {
    bootstrap().then((app) => {
        const port = process.env.PORT || 3001;
        app.listen(port);
        console.log(`Application is running on: http://localhost:${port}`);
    });
}
//# sourceMappingURL=main.js.map