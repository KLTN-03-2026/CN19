const prisma = require('../config/prisma');
const blockchainService = require('../services/blockchain.service');
const EmailService = require('../services/email.service');

/**
 * Controller xử lý Webhook từ các bên thứ 3 (Casso, v.v.)
 */
const WebhookController = {
    /**
     * Xử lý Webhook từ Casso (Đối soát chuyển khoản ngân hàng)
     */
    handleCasso: async (req, res) => {
        try {
            // 1. Kiểm tra Secure Token (Casso / payOS gửi trong Header)
            const webhookToken = req.headers['secure-token'] || req.headers['x-api-key'] || req.headers['payos-checksum'];
            if (
                webhookToken !== process.env.CASSO_WEBHOOK_TOKEN &&
                webhookToken !== process.env.PAYOS_CHECKSUM_KEY &&
                webhookToken !== process.env.PAYOS_API_KEY
            ) {
                return res.status(401).json({ error: 'Unauthorized webhook request' });
            }

            const { data } = req.body;
            if (!data || !Array.isArray(data)) {
                return res.status(200).json({ message: 'No data to process' });
            }

            console.log(`[CASSO WEBHOOK] Received ${data.length} transactions.`);

            for (const transaction of data) {
                const { description, amount, tid } = transaction;

                // Phân tích nội dung chuyển khoản để tìm ID yêu cầu rút tiền
                // Định dạng mong đợi: "BASTICKET WITHDRAW <SHORT_ID>"
                const match = description.toUpperCase().match(/BASTICKET WITHDRAW ([A-Z0-9-]+)/);
                
                if (match) {
                    const shortId = match[1];
                    console.log(`[CASSO] Found withdrawal reference: ${shortId}`);

                    // Tìm yêu cầu rút tiền có ID bắt đầu bằng shortId
                    const withdrawalRequest = await prisma.withdrawalRequest.findFirst({
                        where: {
                            id: { startsWith: shortId },
                            status: { in: ['pending', 'approved'] } // Hỗ trợ cả khi Admin chưa bấm duyệt thủ công
                        },
                        include: { user: true }
                    });

                    if (withdrawalRequest) {
                        // Kiểm tra số tiền (Khớp tuyệt đối số tiền chuyển thực tế, dù âm hay dương)
                        if (Math.abs(Number(withdrawalRequest.net_amount) - Math.abs(amount)) < 100) {
                            let txHash = null;
                            await prisma.$transaction(async (tx) => {
                                // 1. Cập nhật trạng thái yêu cầu rút tiền
                                await tx.withdrawalRequest.update({
                                    where: { id: withdrawalRequest.id },
                                    data: {
                                        status: 'approved', // Chuyển thành approved / completed
                                        processed_at: new Date(),
                                        bank_transaction_id: String(tid),
                                        admin_notes: `Tự động xác nhận qua Casso (TID: ${tid})`
                                    }
                                });

                                // 2. Cập nhật trạng thái giao dịch ví của User
                                const lastTx = await tx.walletTransaction.findFirst({
                                    where: { user_id: withdrawalRequest.user_id, type: 'WITHDRAWAL', status: 'pending' },
                                    orderBy: { created_at: 'desc' }
                                });
                                if (lastTx) {
                                    await tx.walletTransaction.update({
                                        where: { id: lastTx.id },
                                        data: { status: 'completed', description: `Rút tiền thành công qua ngân hàng (TID: ${tid})` }
                                    });
                                }

                                // 3. CHUYỂN PHÍ VỀ VÍ ADMIN (nếu đơn chuyển từ pending sang approved)
                                if (withdrawalRequest.status === 'pending' && withdrawalRequest.fee_amount > 0) {
                                    const adminUser = await tx.user.findFirst({
                                        where: { role: { in: ['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'] } }
                                    });
                                    if (adminUser) {
                                        await tx.user.update({
                                            where: { id: adminUser.id },
                                            data: { balance: { increment: withdrawalRequest.fee_amount } }
                                        });
                                        await tx.walletTransaction.create({
                                            data: {
                                                user_id: adminUser.id,
                                                amount: withdrawalRequest.fee_amount,
                                                type: 'REVENUE',
                                                description: `Thu phí rút tiền từ ${withdrawalRequest.user?.full_name || withdrawalRequest.user?.email || 'Người dùng'} (${withdrawalRequest.fee_percent ? Number(withdrawalRequest.fee_percent) : 2}%)`,
                                                status: 'completed'
                                            }
                                        });
                                    }
                                }

                                // 4. GHI LOG LÊN BLOCKCHAIN (Minh bạch tài chính)
                                try {
                                    txHash = await blockchainService.logFinancialTransaction(
                                        withdrawalRequest.id,
                                        Number(amount),
                                        { ticketPlatformFee: Number(withdrawalRequest.fee_amount) },
                                        'WITHDRAWAL_PAYOUT'
                                    );
                                } catch (bcError) {
                                    console.error('[Web3 Error] Không thể ghi log rút tiền lên Blockchain (Casso):', bcError);
                                }

                                // 5. Cập nhật mã giao dịch vào DB
                                if (txHash) {
                                    await tx.withdrawalRequest.update({
                                        where: { id: withdrawalRequest.id },
                                        data: { payout_trans_id: txHash }
                                    });
                                }
                            });

                            // 6. Gửi email thông báo cho người dùng
                            if (withdrawalRequest.user) {
                                EmailService.sendWithdrawalSuccessEmail(withdrawalRequest.user, withdrawalRequest, txHash);
                            }

                            console.log(`[CASSO SUCCESS] Processed withdrawal for ${withdrawalRequest.user?.email}`);
                        } else {
                            console.warn(`[CASSO WARNING] Amount mismatch for request ${shortId}. Expected ${withdrawalRequest.net_amount}, got ${amount}`);
                        }
                    }
                }
            }

            // Casso yêu cầu trả về status 200
            res.status(200).json({ error: 0, message: 'Webhook processed successfully' });
        } catch (error) {
            console.error('[CASSO ERROR]', error);
            res.status(500).json({ error: 1, message: 'Internal server error' });
        }
    }
};

module.exports = WebhookController;
