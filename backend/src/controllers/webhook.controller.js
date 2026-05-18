const prisma = require('../config/prisma');
const blockchainService = require('../services/blockchain.service');
const EmailService = require('../services/email.service');

/**
 * Controller xử lý Webhook từ các bên thứ 3 (Casso, payOS v.v.)
 */
const WebhookController = {
    /**
     * Xử lý Webhook từ Casso / payOS (Đối soát chuyển khoản ngân hàng)
     */
    handleCasso: async (req, res) => {
        try {
            console.log(`\n[WEBHOOK INCOMING] Headers:`, JSON.stringify(req.headers));
            console.log(`[WEBHOOK INCOMING] Body:`, JSON.stringify(req.body));

            const webhookToken = req.headers['secure-token'] || req.headers['x-api-key'] || req.headers['payos-checksum'] || req.headers['x-payos-checksum'];
            console.log(`[WEBHOOK TOKEN] Received token: ${webhookToken || 'None'}`);

            if (!req.body || (!req.body.data && !Array.isArray(req.body))) {
                return res.status(200).json({ error: 1, message: 'No valid data to process' });
            }

            const rawData = req.body.data || req.body;
            const transactions = Array.isArray(rawData) ? rawData : [rawData];

            console.log(`[WEBHOOK PROCESSING] Received ${transactions.length} transactions.`);

            for (const transaction of transactions) {
                const description = String(transaction.description || transaction.addInfo || '').trim();
                const amount = Number(transaction.amount || 0);
                const tid = String(transaction.tid || transaction.reference || transaction.transactionReference || transaction.orderCode || 'PAYOS_TX');

                console.log(`[TX INFO] Desc: "${description}", Amount: ${amount}, TID: ${tid}`);

                // Trích xuất mã ID rút tiền (8 ký tự đầu của UUID)
                const cleanDesc = description.toUpperCase().replace(/\s+/g, ' ');
                let shortId = null;

                const regexes = [
                    /BASTICKET\s*WITHDRAW\s*([A-Z0-9-]+)/,
                    /WITHDRAW\s*([A-Z0-9-]+)/,
                    /WITH_([A-Z0-9-]+)/
                ];

                for (const reg of regexes) {
                    const match = cleanDesc.match(reg);
                    if (match && match[1] && match[1].length >= 6) {
                        shortId = match[1].toLowerCase();
                        break;
                    }
                }

                if (!shortId) {
                    const words = cleanDesc.split(/[\s_:-]+/);
                    for (const word of words) {
                        if (word.length >= 8 && /^[0-9a-f]{8}/i.test(word)) {
                            shortId = word.toLowerCase().slice(0, 8);
                            break;
                        }
                    }
                }

                if (shortId) {
                    shortId = shortId.toLowerCase();
                    console.log(`[OPEN BANKING] Found matching withdrawal shortId: "${shortId}"`);

                    const withdrawalRequest = await prisma.withdrawalRequest.findFirst({
                        where: {
                            id: { startsWith: shortId },
                            status: { in: ['pending', 'approved'] }
                        },
                        include: { user: true }
                    });

                    if (withdrawalRequest) {
                        console.log(`[MATCH FOUND] Request ID: ${withdrawalRequest.id}, Net Amount: ${withdrawalRequest.net_amount}, Actual Paid: ${amount}`);
                        
                        // Khớp số tiền (cho phép sai số nhỏ hơn 100đ)
                        if (Math.abs(Number(withdrawalRequest.net_amount) - Math.abs(amount)) < 100) {
                            // 1. Thực hiện Transaction cập nhật Database (Nhanh và không bị Web3 block/timeout)
                            await prisma.$transaction(async (tx) => {
                                // a. Cập nhật đơn rút tiền sang 'approved'
                                await tx.withdrawalRequest.update({
                                    where: { id: withdrawalRequest.id },
                                    data: {
                                        status: 'approved',
                                        processed_at: new Date(),
                                        bank_transaction_id: String(tid),
                                        admin_notes: `Tự động xác nhận qua ngân hàng (TID: ${tid})`
                                    }
                                });

                                // b. Cập nhật giao dịch ví của User sang completed
                                const lastTx = await tx.walletTransaction.findFirst({
                                    where: { user_id: withdrawalRequest.user_id, type: 'WITHDRAWAL', status: 'pending' },
                                    orderBy: { created_at: 'desc' }
                                });
                                if (lastTx) {
                                    await tx.walletTransaction.update({
                                        where: { id: lastTx.id },
                                        data: { status: 'completed', description: `Rút tiền thành công (TID: ${tid})` }
                                    });
                                }

                                // c. Thu phí về ví Admin
                                if (withdrawalRequest.status === 'pending' && Number(withdrawalRequest.fee_amount) > 0) {
                                    const adminUser = await tx.user.findFirst({
                                        where: { role: { in: ['admin', 'super_admin', 'ADMIN', 'SUPER_ADMIN'] } }
                                    });
                                    if (adminUser) {
                                        await tx.user.update({
                                            where: { id: adminUser.id },
                                            data: { balance: { increment: Number(withdrawalRequest.fee_amount) } }
                                        });
                                        await tx.walletTransaction.create({
                                            data: {
                                                user_id: adminUser.id,
                                                amount: Number(withdrawalRequest.fee_amount),
                                                type: 'REVENUE',
                                                description: `Thu phí rút tiền từ ${withdrawalRequest.user?.full_name || withdrawalRequest.user?.email || 'User'} (${Number(withdrawalRequest.fee_percent || 2)}%)`,
                                                status: 'completed'
                                            }
                                        });
                                    }
                                }
                            }, { timeout: 15000 }); // Tăng timeout DB lên 15 giây

                            console.log(`[DB COMMIT] Đơn rút tiền ${withdrawalRequest.id} đã được cập nhật thành công trong DB!`);

                            // 2. Ghi log lên Blockchain độc lập (Không gây rollback DB nếu RPC chậm)
                            let txHash = null;
                            try {
                                txHash = await blockchainService.logFinancialTransaction(
                                    withdrawalRequest.id,
                                    Number(amount),
                                    { ticketPlatformFee: Number(withdrawalRequest.fee_amount) },
                                    'WITHDRAWAL_PAYOUT'
                                );

                                if (txHash) {
                                    await prisma.withdrawalRequest.update({
                                        where: { id: withdrawalRequest.id },
                                        data: { payout_trans_id: txHash }
                                    });
                                    console.log(`[Web3 COMMIT] Đã lưu TxHash lên đơn rút tiền: ${txHash}`);
                                }
                            } catch (bcError) {
                                console.error('[Web3 Error] Không thể ghi log rút tiền lên Blockchain:', bcError.message);
                            }

                            // 3. Gửi email thành công
                            if (withdrawalRequest.user) {
                                try {
                                    EmailService.sendWithdrawalSuccessEmail(withdrawalRequest.user, withdrawalRequest, txHash);
                                } catch (emailErr) {
                                    console.error('[Email Error] Không thể gửi email:', emailErr.message);
                                }
                            }

                            console.log(`[SUCCESS] Đơn rút tiền ${withdrawalRequest.id} hoàn tất quy trình duyệt tự động!`);
                        } else {
                            console.warn(`[WARNING] Số tiền không khớp! Đơn yêu cầu ${withdrawalRequest.net_amount}đ nhưng nhận ${amount}đ.`);
                        }
                    } else {
                        console.warn(`[WARNING] Không tìm thấy đơn yêu cầu rút tiền với shortId: ${shortId} ở trạng thái pending/approved.`);
                    }
                } else {
                    console.log(`[INFO] Không tìm thấy shortId hợp lệ trong description: "${description}"`);
                }
            }

            return res.status(200).json({ error: 0, message: 'Webhook processed successfully' });
        } catch (error) {
            console.error('[WEBHOOK ERROR]', error);
            return res.status(500).json({ error: 1, message: 'Internal server error' });
        }
    }
};

module.exports = WebhookController;
