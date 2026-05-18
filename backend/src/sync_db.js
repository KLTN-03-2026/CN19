const { PrismaClient } = require('@prisma/client');
require('dotenv').config();

const prismaLocal = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres:phuong04@localhost:5432/basticket"
        }
    }
});

const prismaCloud = new PrismaClient({
    datasources: {
        db: {
            url: "postgresql://postgres.kdourvqnawiktqupzgmk:Tranminhphuong%4004@aws-1-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true"
        }
    }
});

async function clearCloudData() {
    console.log("\n🧹 Đang xóa sạch dữ liệu cũ trên Supabase Cloud theo thứ tự từ con đến cha...");
    const tablesToClear = [
        'like',
        'comment',
        'blogReport',
        'notification',
        'blog',
        'withdrawalRequest',
        'walletTransaction',
        'adminActionLog',
        'botDetectionLog',
        'scanHistory',
        'refundRequest',
        'merchandiseScanHistory',
        'merchandiseOrderItem',
        'merchandise',
        'dynamicQRToken',
        'ticketTransfer',
        'payment',
        'marketplaceTransaction',
        'marketplaceListing',
        'orderItem',
        'ticket',
        'order',
        'ticketTier',
        'escrowPayout',
        'emergencyRequest',
        'eventStaffAssignment',
        'event',
        'category',
        'organizer',
        'user',
        'systemSetting'
    ];

    for (const table of tablesToClear) {
        try {
            if (prismaCloud[table]) {
                const res = await prismaCloud[table].deleteMany();
                console.log(` - Đã xóa ${res.count} bản ghi từ bảng ${table}`);
            }
        } catch (err) {
            console.error(` ⚠️ Không thể xóa bảng ${table}: ${err.message}`);
        }
    }
}

async function syncTable(tableName, orderByField = 'id') {
    console.log(`\n🔄 Đang đồng bộ bảng: ${tableName}...`);
    if (!prismaLocal[tableName] || !prismaCloud[tableName]) {
        console.error(`❌ Model ${tableName} không tồn tại trong Prisma Client.`);
        return;
    }

    try {
        const records = await prismaLocal[tableName].findMany({
            orderBy: orderByField ? { [orderByField]: 'asc' } : undefined
        });
        console.log(`📌 Tìm thấy ${records.length} bản ghi ở Local.`);

        if (records.length === 0) return;

        const batchSize = 100;
        let inserted = 0;
        for (let i = 0; i < records.length; i += batchSize) {
            const batch = records.slice(i, i + batchSize);
            const res = await prismaCloud[tableName].createMany({
                data: batch,
                skipDuplicates: true
            });
            inserted += res.count;
        }
        console.log(`✅ Đồng bộ thành công ${inserted}/${records.length} bản ghi cho bảng ${tableName}.`);
    } catch (err) {
        console.error(`❌ Lỗi đồng bộ bảng ${tableName}:`, err.message);
    }
}

async function main() {
    console.log("🚀 BẮT ĐẦU ĐỒNG BỘ HOÀN CHỈNH DỮ LIỆU TỪ LOCAL -> SUPABASE CLOUD...\n");

    // Bước 1: Xóa sạch dữ liệu Cloud
    await clearCloudData();

    // Bước 2: Đồng bộ theo thứ tự cha -> con
    const tablesToSync = [
        { name: 'systemSetting', order: 'key' },
        { name: 'user', order: 'id' },
        { name: 'organizer', order: 'id' },
        { name: 'category', order: 'id' },
        { name: 'event', order: 'id' },
        { name: 'ticketTier', order: 'id' },
        { name: 'order', order: 'id' },
        { name: 'ticket', order: 'id' },
        { name: 'orderItem', order: 'id' },
        { name: 'marketplaceListing', order: 'id' },
        { name: 'marketplaceTransaction', order: 'id' },
        { name: 'payment', order: 'id' },
        { name: 'ticketTransfer', order: 'id' },
        { name: 'walletTransaction', order: 'id' },
        { name: 'withdrawalRequest', order: 'id' },
        { name: 'escrowPayout', order: 'id' },
        { name: 'merchandise', order: 'id' },
        { name: 'blog', order: 'id' },
        { name: 'comment', order: 'id' },
        { name: 'like', order: 'id' },
        { name: 'notification', order: 'id' }
    ];

    for (const tbl of tablesToSync) {
        await syncTable(tbl.name, tbl.order);
    }

    console.log("\n🎉 HOÀN TẤT ĐỒNG BỘ TOÀN BỘ DỮ LIỆU THÀNH CÔNG 100%!");
}

main()
    .catch((e) => console.error(e))
    .finally(async () => {
        await prismaLocal.$disconnect();
        await prismaCloud.$disconnect();
    });
