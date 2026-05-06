const fs = require('fs');
const path = 'd:/KLTN_HeThongVeSuKien/BASTICKET/frontend/src/pages/Organizer/Revenue.jsx';

try {
    let content = fs.readFileSync(path, 'utf8');
    
    // Tìm đoạn Số dư hiện có để chèn Phí và Thực nhận
    const searchStr = `<span className="text-gray-400 dark:text-zinc-500">Số dư hiện có:</span>`;
    const replaceStr = `<span className="text-gray-600 dark:text-zinc-500">Số dư hiện có:</span>`;
    
    if (content.includes(searchStr)) {
        content = content.replace(searchStr, replaceStr);
        
        // Chèn khối Phí vào sau thẻ </div> kết thúc dòng Số dư
        const balanceDivEnd = `</span>\n                       <span className="text-blue-600 dark:text-blue-400">{stats.balance.toLocaleString()}đ</span>\n                    </div>`;
        const feeBlock = `\n                    {withdrawAmount >= 100000 && (\n                      <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-500/5 rounded-2xl border border-blue-100 dark:border-blue-500/20 space-y-2">\n                        <div className="flex justify-between text-[10px] font-black uppercase tracking-tight">\n                           <span className="text-gray-600 dark:text-zinc-400">Phí giao dịch (2%):</span>\n                           <span className="text-red-500">{(Number(withdrawAmount) * 0.02).toLocaleString()}đ</span>\n                        </div>\n                        <div className="flex justify-between text-xs font-black uppercase tracking-tight pt-2 border-t border-blue-200 dark:border-blue-500/20">\n                           <span className="text-gray-900 dark:text-white">Số tiền thực nhận:</span>\n                           <span className="text-green-600 dark:text-green-500">{(Number(withdrawAmount) * 0.98).toLocaleString()}đ</span>\n                        </div>\n                      </div>\n                    )}`;
        
        content = content.replace(balanceDivEnd, balanceDivEnd + feeBlock);
        
        fs.writeFileSync(path, content);
        console.log('✅ Đã cập nhật Frontend thành công!');
    } else {
        console.error('❌ Không tìm thấy chuỗi cần thay thế!');
    }
} catch (err) {
    console.error('❌ Lỗi:', err);
}
