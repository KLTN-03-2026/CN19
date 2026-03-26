const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// Lấy danh sách danh mục kèm số lượng sự kiện
const getCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { events: true }
        }
      },
      orderBy: { created_at: 'desc' }
    });
    
    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy danh sách danh mục' });
  }
};

// Tạo danh mục mới
const createCategory = async (req, res) => {
  try {
    const { name, image_url } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ success: false, message: 'Tên danh mục không được để trống' });
    }

    // Kiểm tra trùng tên
    const existing = await prisma.category.findUnique({
      where: { name: name.trim() }
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Tên danh mục này đã tồn tại' });
    }

    const category = await prisma.category.create({
      data: { 
        name: name.trim(),
        image_url: image_url
      }
    });

    res.status(201).json({
      success: true,
      data: category,
      message: 'Tạo danh mục thành công'
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi tạo danh mục' });
  }
};

// Cập nhật danh mục
const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, is_active, image_url } = req.body;

    const existing = await prisma.category.findUnique({ where: { id } });
    if (!existing) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    // Nếu đổi tên, kiểm tra trùng
    if (name && name.trim() !== existing.name) {
      const duplicate = await prisma.category.findUnique({
        where: { name: name.trim() }
      });
      if (duplicate) {
        return res.status(400).json({ success: false, message: 'Tên danh mục mới đã tồn tại' });
      }
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        name: name ? name.trim() : undefined,
        is_active: typeof is_active === 'boolean' ? is_active : undefined,
        image_url: image_url !== undefined ? image_url : undefined
      }
    });

    res.json({
      success: true,
      data: updated,
      message: 'Cập nhật danh mục thành công'
    });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi cập nhật danh mục' });
  }
};

// Xóa danh mục
const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Kiểm tra xem có sự kiện nào thuộc danh mục này không
    const categoryCount = await prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: { events: true }
        }
      }
    });

    if (!categoryCount) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    if (categoryCount._count.events > 0) {
      return res.status(400).json({ 
        success: false, 
        message: `Không thể xóa danh mục này vì đang có ${categoryCount._count.events} sự kiện thuộc danh mục này.` 
      });
    }

    await prisma.category.delete({ where: { id } });

    res.json({
      success: true,
      message: 'Xóa danh mục thành công'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi xóa danh mục' });
  }
};

// Lấy chi tiết danh mục kèm danh sách sự kiện
const getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const category = await prisma.category.findUnique({
      where: { id },
      include: {
        events: {
          include: {
            organizer: {
              select: { organization_name: true }
            }
          },
          orderBy: { event_date: 'desc' }
        },
        _count: {
          select: { events: true }
        }
      }
    });

    if (!category) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy danh mục' });
    }

    res.json({
      success: true,
      data: category
    });
  } catch (error) {
    console.error('Error fetching category detail:', error);
    res.status(500).json({ success: false, message: 'Lỗi khi lấy chi tiết danh mục' });
  }
};

module.exports = {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoryById
};
