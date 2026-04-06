const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkBlogs() {
  try {
    const blogs = await prisma.blog.findMany({
      select: {
        id: true,
        title: true,
        status: true,
        type: true,
        author: { select: { email: true, role: true } }
      }
    });
    console.log('Total Blogs found:', blogs.length);
    console.table(blogs);
  } catch (error) {
    console.error(error);
  } finally {
    await prisma.$disconnect();
  }
}

checkBlogs();
