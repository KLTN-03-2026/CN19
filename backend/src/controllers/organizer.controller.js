const prisma = require('../config/prisma');

// [UC_06] Xem trang cá nhân Ban tổ chức
const getOrganizerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await prisma.organizer.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, phone_number: true, avatar_url: true, status: true, created_at: true } },
        events: {
          where: { 
            status: { in: ['active', 'completed'] } 
          },
          select: {
            id: true,
            title: true,
            event_date: true,
            image_url: true,
            status: true,
            category: { select: { name: true } }
          },
          orderBy: { event_date: 'desc' }
        }
      }
    });

    if (!organizer) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin Ban tổ chức.' });
    }

    res.status(200).json({ data: organizer });
  } catch (error) {
    console.error('Lỗi khi tải trang cá nhân Ban tổ chức:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_22] Xem hồ sơ cá nhân (Dành cho Dashboard)
const getOrganizerSelfProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const organizer = await prisma.organizer.findUnique({
      where: { user_id: userId },
      include: {
        user: { 
          select: { 
            email: true, 
            phone_number: true, 
            avatar_url: true, 
            status: true, 
            created_at: true,
            full_name: true
          } 
        }
      }
    });

    if (!organizer) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin Ban tổ chức.' });
    }

    res.status(200).json({ data: organizer });
  } catch (error) {
    console.error('Lỗi khi tải hồ sơ Ban tổ chức:', error);
    res.status(500).json({ error: 'Lỗi server.' });
  }
};

// [UC_23] Cập nhật hồ sơ Ban tổ chức
const updateOrganizerProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { organization_name, description, address_raw, full_name, avatar_url } = req.body;

    const organizer = await prisma.organizer.findUnique({ where: { user_id: userId } });
    if (!organizer) {
      return res.status(404).json({ error: 'Không tìm thấy thông tin Ban tổ chức.' });
    }

    // Cập nhật Organizer và User song song
    try {
      await prisma.$transaction([
        prisma.organizer.update({
          where: { user_id: userId },
          data: {
            organization_name,
            description,
            address_raw
          }
        }),
        prisma.user.update({
          where: { id: userId },
          data: {
            full_name,
            avatar_url
          }
        })
      ]);
    } catch (dbError) {
      console.error('Lỗi Database Transaction:', dbError);
      return res.status(400).json({ error: 'Không có thay đổi nào được thực hiện hoặc dữ liệu không hợp lệ.' });
    }

    return res.status(200).json({ 
      success: true,
      message: 'Cập nhật hồ sơ thành công.' 
    });
  } catch (error) {
    console.error('Lỗi khi cập nhật hồ sơ Ban tổ chức:', error);
    res.status(500).json({ error: 'Lỗi server khi cập nhật hồ sơ.' });
  }
};

module.exports = {
  getOrganizerProfile,
  getOrganizerSelfProfile,
  updateOrganizerProfile
};
