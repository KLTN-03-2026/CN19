const prisma = require('./config/prisma');

async function main() {
    const requests = await prisma.withdrawalRequest.findMany({
        include: { user: { select: { email: true } } }
    });
    console.log("ALL WITHDRAWAL REQUESTS:");
    requests.forEach(r => {
        console.log(`- ID: ${r.id}, Status: ${r.status}, Amount: ${r.amount}, User: ${r.user?.email}`);
    });
}

main().catch(console.error).finally(() => prisma.$disconnect());
