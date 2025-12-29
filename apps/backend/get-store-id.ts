import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const store = await prisma.store.findFirst();
    if (store) {
        console.log(`STORE_ID=${store.id}`);
    } else {
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
