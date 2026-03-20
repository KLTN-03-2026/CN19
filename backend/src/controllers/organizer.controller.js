const prisma = require('../config/prisma');

// [UC_06] Xem trang cá nhân Ban tổ chức
const getOrganizerProfile = async (req, res) => {
  try {
    const { id } = req.params;

    const organizer = await prisma.organizer.findUnique({
      where: { id },
      include: {
        user: { select: { email: true, phone_number: true, avatar_url: true } },
        events: {
          where: { status: 'active' }, // Chỉ hiển thị các sự kiện đang mở bán
          select: {
            id: true,
            title: true,
            event_date: true,
            category: { select: { name: true } }
          }
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

module.exports = {
  getOrganizerProfile
};
