const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- FETCHING LATEST BOT DETECTION LOGS ---');
  const logs = await prisma.botDetectionLog.findMany({
    take: 5,
    orderBy: {
      created_at: 'desc'
    },
    include: {
      user: {
        select: {
          email: true,
          full_name: true
        }
      }
    }
  });

  if (logs.length === 0) {
    console.log('No logs found.');
  } else {
    logs.forEach((log, index) => {
      console.log(`\nLog #${index + 1}`);
      console.log(`ID: ${log.id}`);
      console.log(`Action: ${log.event_type || 'UNKNOWN'}`);
      console.log(`User: ${log.user?.full_name || 'GUEST'} (${log.user?.email || 'N/A'})`);
      console.log(`Time: ${log.created_at}`);
      console.log(`Risk Score: ${log.risk_score}`);
      console.log(`Decision: ${log.decision}`);
      console.log(`IP: ${log.ip_address}`);
      console.log(`Click Speed: ${log.click_speed_ms}ms`);
      console.log(`Form Fill: ${log.form_fill_duration}ms`);
      console.log(`Details: ${JSON.stringify(log.detection_details)}`);
    });
  }
}

main()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });
