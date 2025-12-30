import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
    @Get()
    getRoot() {
        return {
            message: 'Table Order System API',
            status: 'running',
            version: '0.0.2',
            endpoints: {
                health: '/api/v1/health',
                stores: '/api/v1/stores',
                menus: '/api/v1/menus',
                orders: '/api/v1/orders',
            },
            docs: 'https://github.com/gudrms/order_front',
        };
    }
}
