const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'pages', 'Admin', 'EventDetail.jsx');
let content = fs.readFileSync(filePath, 'utf8');

// We search for dangerouslySetInnerHTML followed by closing tag and the next div.space-y-4
const targetPattern = /dangerouslySetInnerHTML=\{\{\s*__html:\s*event\.description\s*\|\|\s*["']<p>Chưa cung cấp mô tả\.<\/p>["']\s*\}\}\s*\/>\s*<div\s+className="space-y-4">/;

if (targetPattern.test(content)) {
  console.log('Tìm thấy mẫu bị lỗi!');
  content = content.replace(
    /dangerouslySetInnerHTML=\{\{\s*__html:\s*event\.description\s*\|\|\s*["']<p>Chưa cung cấp mô tả\.<\/p>["']\s*\}\}\s*\/>\s*<div\s+className="space-y-4">/,
    'dangerouslySetInnerHTML={{ __html: event.description || "<p>Chưa cung cấp mô tả.</p>" }}\n                           />\n                       </div>\n                       <div className="space-y-4">'
  );
  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Đã sửa thành công!');
} else {
  console.log('Không tìm thấy mẫu!');
  // Let's print out what is there
  const index = content.indexOf('dangerouslySetInnerHTML');
  if (index !== -1) {
    console.log('Đoạn code quanh dangerouslySetInnerHTML:');
    console.log(content.substring(index, index + 300));
  }
}
