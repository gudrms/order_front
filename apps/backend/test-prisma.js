const { PrismaClient } = require('@prisma/client');

async function main() {
    console.log('Initializing PrismaClient...');
    const prisma = new PrismaClient({
        log: ['query', 'info', 'warn', 'error'],
    });

    try {
        console.log('Attempting to connect to database...');
        // Set a timeout for the connection attempt
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Connection timed out after 10 seconds')), 10000)
        );

        const connectionPromise = prisma.$connect();

        await Promise.race([connectionPromise, timeoutPromise]);
        console.log('✅ Successfully connected to the database!');

        console.log('Running simple query (SELECT 1)...');
        const result = await prisma.$queryRaw`SELECT 1 as result`;
        console.log('✅ Query result:', result);

    } catch (e) {
        console.error('❌ Connection failed:');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
