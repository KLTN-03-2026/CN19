import * as XLSX from 'xlsx';

/**
 * Xuất dữ liệu ra file Excel
 * @param {Array} data - Mảng các object dữ liệu
 * @param {string} fileName - Tên file xuất ra (không kèm extension)
 * @param {string} sheetName - Tên sheet trong Excel
 */
export const exportToExcel = (data, fileName = 'Report', sheetName = 'Data') => {
  try {
    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    
    // Xuất file
    XLSX.writeFile(workbook, `${fileName}_${new Date().getTime()}.xlsx`);
    return true;
  } catch (error) {
    console.error('Excel Export Error:', error);
    return false;
  }
};
