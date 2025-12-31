"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const store = await prisma.store.findFirst();
    if (store) {
        console.log(`STORE_ID=${store.id}`);
    }
    else {
        console.log('No store found');
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
//# sourceMappingURL=get-store-id.js.map