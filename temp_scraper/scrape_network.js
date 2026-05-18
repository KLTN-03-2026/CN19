const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  
  let eventsData = null;
  
  page.on('response', async (response) => {
    const url = response.url();
    if (url.includes('ticketbox') && (url.includes('api') || url.includes('graphql') || url.includes('search') || url.includes('event'))) {
      if (response.request().resourceType() === 'fetch' || response.request().resourceType() === 'xhr') {
        try {
          const text = await response.text();
          if (text.includes('events') || text.includes('items') || text.includes('data')) {
            const data = JSON.parse(text);
            fs.appendFileSync('network_log.txt', url + '\n' + text.substring(0, 500) + '\n\n');
          }
        } catch(e) {}
      }
    }
  });

  await page.goto('https://ticketbox.vn/', { waitUntil: 'networkidle0' });
  
  console.log('Saved network logs to network_log.txt');
  await browser.close();
})();
