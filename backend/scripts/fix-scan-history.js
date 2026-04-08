/**
 * Script: Tạo ScanHistory cho các vé đã check-in nhưng chưa có lịch sử quét
 * Chạy: node scripts/fix-scan-history.js
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const usedTickets = await prisma.ticket.findMany({
    where: { is_used: true },
    include: {
      scan_history: true,
      event: { select: { id: true, title: true } },
      order: {
        include: {
          customer: { select: { full_name: true } }
        }
      },
      ticket_tier: { select: { tier_name: true } }
    }
  });

  console.log(`\n📋 Tổng vé đã check-in (is_used=true): ${usedTickets.length}`);

  const ticketsWithoutHistory = usedTickets.filter(t => t.scan_history.length === 0);
  console.log(`⚠️  Vé chưa có ScanHistory: ${ticketsWithoutHistory.length}`);

  if (ticketsWithoutHistory.length === 0) {
    console.log('\n✅ Tất cả vé đã có lịch sử quét rồi!');
    for (const t of usedTickets) {
      console.log(`  - [${t.event.title}] ${t.ticket_number} → ${t.scan_history.length} bản ghi`);
    }
    return;
  }

  // Tạo ScanHistory cho từng vé thiếu
  for (const ticket of ticketsWithoutHistory) {
    const randomHoursAgo = Math.floor(Math.random() * 24) + 1;
    const scannedAt = new Date(Date.now() - randomHoursAgo * 60 * 60 * 1000);

    await prisma.scanHistory.create({
      data: {
        ticket_id: ticket.id,
        is_success: true,
        scanned_at: scannedAt,
      }
    });

    const customerName = ticket.order?.customer?.full_name || 'N/A';
    console.log(`  ✅ [${ticket.event.title}] Vé: ${ticket.ticket_number} | Loại: ${ticket.ticket_tier?.tier_name} | Khách: ${customerName}`);
  }

  console.log(`\n🎉 Đã tạo ${ticketsWithoutHistory.length} bản ghi ScanHistory!`);
  const total = await prisma.scanHistory.count();
  console.log(`📊 Tổng ScanHistory trong DB: ${total} bản ghi\n`);
}

main()
  .catch(e => {
    console.error('❌ Lỗi:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
