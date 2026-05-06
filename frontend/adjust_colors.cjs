const fs = require('fs');
let content = fs.readFileSync('src/pages/Organizer/EventDetail.jsx', 'utf8');

// Greys - make them darker in light mode
content = content.replace(/text-gray-400/g, 'text-gray-500');
content = content.replace(/text-gray-300/g, 'text-gray-400');

// Borders - make them more visible in light mode
content = content.replace(/border-gray-100/g, 'border-gray-200');
content = content.replace(/border-gray-50/g, 'border-gray-100');

fs.writeFileSync('src/pages/Organizer/EventDetail.jsx', content);
console.log('Colors adjusted successfully');
