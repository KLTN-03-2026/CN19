const cron = require('node-cron');
const prisma = require('../config/prisma');
const blockchainService = require('../services/blockchain.service');

/**
 * Hàm thực hiện quyết toán tự động cho một sự kiện
 * Có thể xử lý yêu cầu mới hoặc hoàn tất yêu cầu đang chờ (pending)
 */
const autoSettleEvent = async (event) => {
    // Tìm xem đã có yêu cầu Payout nào đang chờ (pending/processing) không
    const existingPayout = await prisma.escrowPayout.findFirst({
        where: { event_id: event.id, status: { in: ['pending', 'processing'] } }
    });

    // Lấy các đơn hàng chưa quyết toán
    const unsettledOrders = await prisma.order.findMany({
        where: { event_id: event.id, status: 'paid', is_settled: false, order_type: 'TICKET_PURCHASE' }
    });

    const unsettledMarketplace = await prisma.marketplaceTransaction.findMany({
        where: { ticket: { event_id: event.id }, status: 'paid', is_settled: false }
    });

    if (unsettledOrders.length === 0 && unsettledMarketplace.length === 0 && !existingPayout) {
        return { skipped: true, reason: 'Không có dữ liệu mới để quyết toán' };
    }

    let totalRevenue, platformFee, netPayout;

    if (existingPayout) {
        // Nếu đã có yêu cầu đang chờ, lấy con số từ yêu cầu đó
        totalRevenue = Number(existingPayout.total_revenue);
        platformFee = Number(existingPayout.platform_fee);
        netPayout = Number(existingPayout.net_payout);
    } else {
        // Nếu chưa có, tính toán mới
        totalRevenue = unsettledOrders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        platformFee = unsettledOrders.reduce((sum, o) => sum + Number(o.platform_fee), 0);
        const royalties = unsettledMarketplace.reduce((sum, tx) => sum + Number(tx.organizer_royalty || 0), 0);
        netPayout = (totalRevenue - platformFee) + royalties;
    }

    const fullEvent = await prisma.event.findUnique({
        where: { id: event.id },
        include: { organizer: true }
    });

    // 1. Thực hiện đối soát Sổ cái Blockchain
    let reconciliationFailed = false;
    let failedItemDetails = '';

    for (const order of unsettledOrders) {
        const isOk = await blockchainService.verifyOrderReconciliation(order);
        if (!isOk) {
            reconciliationFailed = true;
            failedItemDetails = `Đơn hàng ${order.order_number} sai lệch dữ liệu Blockchain.`;
            break;
        }
    }

    if (!reconciliationFailed) {
        for (const tx of unsettledMarketplace) {
            const isOk = await blockchainService.verifyMarketplaceReconciliation(tx);
            if (!isOk) {
                reconciliationFailed = true;
                failedItemDetails = `Giao dịch Marketplace ${tx.transaction_number} sai lệch dữ liệu Blockchain.`;
                break;
            }
        }
    }

    if (reconciliationFailed) {
        console.error(`[AutoSettle] ❌ Đối soát Blockchain thất bại cho sự kiện "${event.title}": ${failedItemDetails}`);
        
        // Cập nhật trạng thái Payout thành bị từ chối/lỗi đối soát
        if (existingPayout) {
            await prisma.escrowPayout.update({
                where: { id: existingPayout.id },
                data: {
                    status: 'rejected',
                    processed_at: new Date(),
                    admin_notes: `[Auto-Settle] THẤT BẠI ĐỐI SOÁT BLOCKCHAIN: ${failedItemDetails}`
                }
            });
        } else {
            await prisma.escrowPayout.create({
                data: {
                    event_id: event.id,
                    total_revenue: totalRevenue || 0,
                    platform_fee: platformFee || 0,
                    net_payout: netPayout || 0,
                    status: 'rejected',
                    requested_at: new Date(),
                    processed_at: new Date(),
                    admin_notes: `[Auto-Settle] THẤT BẠI ĐỐI SOÁT BLOCKCHAIN: ${failedItemDetails}`,
                    bank_info: {}
                }
            });
        }

        // Tạo thông báo cho BTC
        await prisma.notification.create({
            data: {
                user_id: fullEvent.organizer.user_id,
                type: 'SETTLEMENT_FAILED_RECONCILIATION',
                title: 'Đối soát Blockchain thất bại!',
                message: `Hệ thống phát hiện sai lệch dữ liệu tài chính với Blockchain ở sự kiện "${event.title}". Vui lòng liên hệ Admin để kiểm tra.`
            }
        });

        // Tạo thông báo cho Admin
        const admins = await prisma.user.findMany({
            where: { role: 'admin' }
        });
        for (const admin of admins) {
            await prisma.notification.create({
                data: {
                    user_id: admin.id,
                    type: 'SETTLEMENT_FAILED_RECONCILIATION',
                    title: 'Cảnh báo đối soát thất bại!',
                    message: `Sự kiện "${event.title}" của BTC "${fullEvent.organizer.organization_name}" thất bại đối soát Blockchain: ${failedItemDetails}`
                }
            });
        }

        return { settled: false, reason: 'Đối soát Blockchain thất bại', details: failedItemDetails };
    }

    await prisma.$transaction(async (tx) => {
        if (existingPayout) {
            // Cập nhật yêu cầu hiện có
            await tx.escrowPayout.update({
                where: { id: existingPayout.id },
                data: {
                    status: 'settled',
                    processed_at: new Date(),
                    admin_notes: (existingPayout.admin_notes || '') + ' [Auto-Settle sau 3 ngày]',
                    payout_trans_id: existingPayout.payout_trans_id || ('AUTO-SETTLE-' + Date.now())
                }
            });
        } else {
            // Tạo bản ghi mới
            await tx.escrowPayout.create({
                data: {
                    event_id: event.id,
                    total_revenue: totalRevenue,
                    platform_fee: platformFee,
                    net_payout: netPayout,
                    status: 'settled',
                    requested_at: new Date(),
                    processed_at: new Date(),
                    admin_notes: 'Tự động quyết toán sau 3 ngày sự kiện kết thúc',
                    payout_trans_id: 'AUTO-SETTLE-' + Date.now(),
                    bank_info: {}
                }
            });
        }

        // 2. Cộng tiền vào ví BTC
        await tx.user.update({
            where: { id: fullEvent.organizer.user_id },
            data: { balance: { increment: netPayout } }
        });

        // 3. Ghi nhật ký ví
        await tx.walletTransaction.create({
            data: {
                user_id: fullEvent.organizer.user_id,
                amount: netPayout,
                type: 'REVENUE',
                description: `Quyết toán tự động: ${event.title}`,
                status: 'completed'
            }
        });

        // 4. Đánh dấu Orders
        await tx.order.updateMany({
            where: { event_id: event.id, status: 'paid', is_settled: false, order_type: 'TICKET_PURCHASE' },
            data: { is_settled: true }
        });

        // 5. Xử lý Marketplace
        for (const mktTx of unsettledMarketplace) {
            await tx.user.update({
                where: { id: mktTx.seller_id },
                data: { balance: { increment: mktTx.seller_receive_amount } }
            });
            await tx.walletTransaction.create({
                data: {
                    user_id: mktTx.seller_id,
                    amount: mktTx.seller_receive_amount,
                    type: 'REVENUE',
                    description: `Tiền bán vé Marketplace: ${event.title}`,
                    status: 'completed'
                }
            });
            await tx.marketplaceTransaction.update({
                where: { id: mktTx.id },
                data: { is_settled: true }
            });
        }
    });

    return { settled: true, net_payout: netPayout };
};

const startAutoSettlementJob = () => {
    cron.schedule('0 2 * * *', async () => {
        console.log('[AutoSettle] Bắt đầu kiểm tra quyết toán...');
        try {
            const threeDaysAgo = new Date();
            threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
            threeDaysAgo.setHours(0, 0, 0, 0);

            const eligibleEvents = await prisma.event.findMany({
                where: {
                    OR: [
                        { end_date: { lt: threeDaysAgo } },
                        { AND: [{ end_date: null }, { event_date: { lt: threeDaysAgo } }] }
                    ],
                    status: { not: 'cancelled' },
                    // Điều kiện mới: KHÔNG CÓ payout nào đã ở trạng thái 'settled'
                    // Nhưng có thể có payout đang 'pending' hoặc 'processing'
                    payouts: {
                        none: { status: 'settled' }
                    }
                }
            });

            if (eligibleEvents.length === 0) return;

            for (const event of eligibleEvents) {
                try {
                    await autoSettleEvent(event);
                    console.log(`[AutoSettle] ✅ Settle thành công: ${event.title}`);
                } catch (err) {
                    console.error(`[AutoSettle] ❌ Lỗi "${event.title}":`, err.message);
                }
            }
        } catch (err) {
            console.error('[AutoSettle] Critical Error:', err);
        }
    }, { scheduled: true, timezone: 'Asia/Ho_Chi_Minh' });
};

module.exports = { startAutoSettlementJob, autoSettleEvent };
