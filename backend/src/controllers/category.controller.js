const prisma = require('../config/prisma');

// [Public] Lấy danh sách toàn bộ danh mục đang hoạt động
const getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      where: { is_active: true },
      select: {
        id: true,
        name: true,
      }
    });
    res.status(200).json({ data: categories });
  } catch (error) {
    console.error('Lỗi khi lấy danh mục:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

module.exports = {
  getAllCategories
};
