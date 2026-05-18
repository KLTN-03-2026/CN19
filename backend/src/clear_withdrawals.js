const prisma = require('./config/prisma');

async function main() {
    console.log("Bắt đầu dọn dẹp các yêu cầu rút tiền cũ...");
    
    // 1. Lấy tất cả yêu cầu rút tiền
    const requests = await prisma.withdrawalRequest.findMany({
        include: { user: true }
    });
    
    console.log(`Tìm thấy ${requests.length} yêu cầu rút tiền cần xử lý.`);

    for (const req of requests) {
        await prisma.$transaction(async (tx) => {
            // Hoàn lại nguyên vẹn số tiền gốc (amount) vào ví người dùng
            if (req.user) {
                await tx.user.update({
                    where: { id: req.user_id },
                    data: { balance: { increment: req.amount } }
                });
                console.log(`[+] Đã hoàn ${req.amount} VNĐ vào ví của User: ${req.user.email}`);
            }

            // Xóa các giao dịch ví (Lịch sử rút tiền) của user này để làm sạch giao diện
            await tx.walletTransaction.deleteMany({
                where: { 
                    user_id: req.user_id,
                    type: 'WITHDRAWAL'
                }
            });

            // Xóa yêu cầu rút tiền
            await tx.withdrawalRequest.delete({
                where: { id: req.id }
            });
            
            console.log(`[-] Đã xóa yêu cầu rút tiền ID: ${req.id}`);
        });
    }

    // Xóa luôn các giao dịch thu phí rút tiền của Admin (nếu có) để trả lại trạng thái nguyên bản
    const adminTx = await prisma.walletTransaction.deleteMany({
        where: {
            type: 'REVENUE',
            description: { contains: 'Thu phí rút tiền' }
        }
    });
    console.log(`[-] Đã xóa ${adminTx.count} giao dịch thu phí của Admin.`);

    console.log("HOÀN TẤT: Dữ liệu đã được dọn sạch sẽ và hoàn tiền 100%!");
}

main()
    .catch((e) => {
        console.error("Lỗi:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
