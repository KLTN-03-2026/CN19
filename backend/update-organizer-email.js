const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function updateEmail() {
  console.log('🔄 Đang cập nhật email tài khoản Ban tổ chức thành: tranminhphuong732004@gmail.com...');

  try {
    // Tìm tài khoản organizer@basticket.com
    const oldUser = await prisma.user.findUnique({
      where: { email: 'organizer@basticket.com' }
    });

    if (oldUser) {
      await prisma.user.update({
        where: { id: oldUser.id },
        data: { email: 'tranminhphuong732004@gmail.com' }
      });
      console.log('🎉 Cập nhật thành công! Toàn bộ 5 sự kiện, 2 blog và 3 sản phẩm đã được gắn vào tài khoản: tranminhphuong732004@gmail.com');
    } else {
      const alreadyUpdated = await prisma.user.findUnique({
        where: { email: 'tranminhphuong732004@gmail.com' }
      });
      if (alreadyUpdated) {
        console.log('✔️ Tài khoản đã mang email: tranminhphuong732004@gmail.com');
      } else {
        console.log('⚠️ Không tìm thấy tài khoản để cập nhật.');
      }
    }
  } catch (error) {
    console.error('❌ Lỗi khi cập nhật email:', error);
  } finally {
    await prisma.$disconnect();
  }
}

updateEmail();
