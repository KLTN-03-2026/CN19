require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL);
const { PrismaClient } = require('@prisma/client');
try {
  const prisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL
  });
  console.log('Prisma initialized successfully.');
} catch (e) {
  console.error('Error:', e);
}
