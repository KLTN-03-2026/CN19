const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({ headless: 'new' });
  const page = await browser.newPage();
  await page.goto('https://ticketbox.vn/', { waitUntil: 'networkidle2' });
  
  // Wait for event cards to load
  try {
    await page.waitForSelector('.event-card, .event-item, [class*="EventCard"]', { timeout: 10000 });
  } catch(e) {
    console.log('Timeout waiting for event cards');
  }

  const events = await page.evaluate(() => {
    // Ticketbox usually has links with href containing "/events/"
    const eventLinks = Array.from(document.querySelectorAll('a[href*="/events/"]'));
    const uniqueEvents = [];
    const seen = new Set();
    
    eventLinks.forEach(link => {
      const url = link.href;
      if (!seen.has(url)) {
        seen.add(url);
        
        // Try to get title, date, location from the link's text content or inner elements
        const textContent = link.innerText.split('\n').map(s => s.trim()).filter(s => s);
        let title = textContent[0] || '';
        let date = textContent[1] || '';
        let location = textContent[2] || '';
        
        // Try to get image
        const img = link.querySelector('img');
        const imgUrl = img ? img.src : '';
        
        uniqueEvents.push({
          title,
          date,
          location,
          url,
          imgUrl
        });
      }
    });
    
    return uniqueEvents.slice(0, 15);
  });
  
  fs.writeFileSync('events.json', JSON.stringify(events, null, 2));
  console.log('Saved 15 events to events.json');
  await browser.close();
})();
