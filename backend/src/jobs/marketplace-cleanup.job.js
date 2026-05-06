const cron = require('node-cron');
const prisma = require('../config/prisma');
const web3Service = require('../services/web3.service');

/**
 * [CRON JOB] Tự động gỡ các bài đăng Marketplace khi sự kiện kết thúc
 * Chạy định kỳ mỗi 1 tiếng
 */
const startMarketplaceCleanupJob = () => {
    cron.schedule('0 * * * *', async () => {
        console.log('[MarketplaceCleanup] Đang kiểm tra các bài đăng hết hạn...');
        try {
            const now = new Date();

            // 1. Tìm các bài đăng Active của những Sự kiện đã kết thúc
            const expiredListings = await prisma.marketplaceListing.findMany({
                where: {
                    status: 'active',
                    event: {
                        OR: [
                            { end_date: { lt: now } },
                            { AND: [{ end_date: null }, { event_date: { lt: now } }] }
                        ]
                    }
                },
                include: {
                    event: true,
                    ticket: true
                }
            });

            if (expiredListings.length === 0) {
                console.log('[MarketplaceCleanup] Không có bài đăng nào cần gỡ.');
                return;
            }

            console.log(`[MarketplaceCleanup] Tìm thấy ${expiredListings.length} bài đăng cần gỡ.`);

            for (const listing of expiredListings) {
                try {
                    await prisma.$transaction(async (tx) => {
                        // 1. Cập nhật trạng thái Listing -> cancelled (hoặc expired)
                        await tx.marketplaceListing.update({
                            where: { id: listing.id },
                            data: { status: 'cancelled' }
                        });

                        // 2. Mở khóa vé
                        await tx.ticket.update({
                            where: { id: listing.ticket_id },
                            data: { is_on_marketplace: false }
                        });

                        // 3. Nếu có vật phẩm đi kèm, gỡ liên kết listing_id
                        await tx.merchandiseOrderItem.updateMany({
                            where: { listing_id: listing.id },
                            data: { listing_id: null }
                        });
                    });

                    // 4. Mở khóa NFT trên Blockchain (Nên làm để trả lại quyền kiểm soát cho user)
                    if (listing.ticket.nft_token_id && listing.event.smart_contract_address) {
                        try {
                            await web3Service.unlockTicket(
                                listing.event.smart_contract_address, 
                                parseInt(listing.ticket.nft_token_id)
                            );
                        } catch (web3Err) {
                            console.error(`[MarketplaceCleanup] Lỗi unlock NFT cho vé #${listing.ticket.nft_token_id}:`, web3Err.message);
                        }
                    }

                    console.log(`[MarketplaceCleanup] ✅ Đã gỡ bài đăng ${listing.listing_number} (Sự kiện: ${listing.event.title})`);
                } catch (listingErr) {
                    console.error(`[MarketplaceCleanup] ❌ Lỗi khi gỡ bài ${listing.listing_number}:`, listingErr.message);
                }
            }
        } catch (error) {
            console.error('[MarketplaceCleanup] Critical Error:', error);
        }
    }, { scheduled: true, timezone: 'Asia/Ho_Chi_Minh' });
};

module.exports = { startMarketplaceCleanupJob };
