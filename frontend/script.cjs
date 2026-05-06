const fs = require('fs');
let content = fs.readFileSync('src/pages/Organizer/EventDetail.jsx', 'utf8');
content = content.replace(/className="([^"]*)"/g, (m, c) => {
    if (c.includes('font-black') && !c.match(/text-(xl|2xl|3xl|4xl|lg)/)) return 'className="' + c.replace(/font-black/g, 'font-bold') + '"';
    return m;
});
content = content.replace(/className=\{`([^`]*)`\}/g, (m, c) => {
    if (c.includes('font-black') && !c.match(/text-(xl|2xl|3xl|4xl|lg)/)) return 'className={`' + c.replace(/font-black/g, 'font-bold') + '`}';
    return m;
});
fs.writeFileSync('src/pages/Organizer/EventDetail.jsx', content);
console.log('Replaced successfully');
