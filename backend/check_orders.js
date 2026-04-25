const { PrismaClient } = require('./prisma/src/generated/client');
const prisma = new PrismaClient();

async function checkOrders() {
    try {
        console.log('--- 5 ĐƠN HÀNG MỚI NHẤT ---');
        const orders = await prisma.order.findMany({
            orderBy: { created_at: 'desc' },
            take: 5,
            include: {
                customer: { select: { email: true, full_name: true } },
                event: { select: { title: true } }
            }
        });

        orders.forEach(o => {
            console.log(`ID: ${o.id}`);
            console.log(`Mã: ${o.order_number}`);
            console.log(`KH: ${o.customer?.full_name} (${o.customer?.email})`);
            console.log(`Sự kiện: ${o.event?.title}`);
            console.log(`Tổng tiền: ${o.total_amount}`);
            console.log(`Trạng thái: ${o.status}`);
            console.log(`Ngày tạo: ${o.created_at.toLocaleString()}`);
            console.log('---');
        });

        console.log('\n--- 5 GIAO DỊCH THANH TOÁN (PAYMENT) MỚI NHẤT ---');
        const payments = await prisma.payment.findMany({
            orderBy: { created_at: 'desc' },
            take: 5
        });

        payments.forEach(p => {
            console.log(`ID: ${p.id}`);
            console.log(`Phương thức: ${p.method}`);
            console.log(`Số tiền: ${p.amount}`);
            console.log(`Trạng thái: ${p.status}`);
            console.log(`Mã GD: ${p.transaction_id}`);
            console.log(`Ngày: ${p.created_at.toLocaleString()}`);
            console.log('---');
        });

    } catch (error) {
        console.error('Lỗi:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkOrders();
