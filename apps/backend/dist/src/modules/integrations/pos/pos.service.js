"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var PosService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PosService = void 0;
const common_1 = require("@nestjs/common");
let PosService = PosService_1 = class PosService {
    constructor() {
        this.logger = new common_1.Logger(PosService_1.name);
    }
    async sendOrderToPos(order) {
        this.logger.log(`[POS Integration] Sending order to POS... OrderID: ${order.id}`);
        this.logger.log(`[POS Integration] Items: ${JSON.stringify(order.items, null, 2)}`);
        await new Promise(resolve => setTimeout(resolve, 1000));
        this.logger.log(`[POS Integration] Order sent successfully!`);
        return { success: true, posOrderId: `POS-${order.orderNumber}` };
    }
};
exports.PosService = PosService;
exports.PosService = PosService = PosService_1 = __decorate([
    (0, common_1.Injectable)()
], PosService);
//# sourceMappingURL=pos.service.js.map