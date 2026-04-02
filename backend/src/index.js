require('dotenv').config();
const express = require('express');
const cors = require('cors');

// --- Import Routes ---
// 1. Auth & Users
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

// 2. Events & Categories
const categoryRoutes = require('./routes/category.routes');
const eventRoutes = require('./routes/event.routes');

// 3. Orders, Payments & Tickets
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const ticketRoutes = require('./routes/ticket.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const transactionRoutes = require('./routes/transaction.routes');
const refundRoutes = require('./routes/refund.routes');

// 4. Organizer
const organizerRoutes = require('./routes/organizer.routes');
const organizerEventRoutes = require('./routes/organizer-event.routes');
const staffRoutes = require('./routes/staff.routes');
const organizerStatRoutes = require('./routes/organizer-stat.routes');
const organizerTicketRoutes = require('./routes/organizer-ticket.routes');
const organizerMerchandiseRoutes = require('./routes/organizer-merchandise.routes');

// 5. Admin
const adminUserRoutes = require('./routes/admin-user.routes');
const adminEventRoutes = require('./routes/admin-event.routes');
const adminCategoryRoutes = require('./routes/admin-category.routes');
const adminFinanceRoutes = require('./routes/admin-finance.routes');
const adminSystemRoutes = require('./routes/admin-system.routes');

// 6. Staff
const scannerRoutes = require('./routes/scanner.routes');

// 7. Utilities & Others
const aiRoutes = require('./routes/ai.routes');
const metadataRoutes = require('./routes/metadata.routes');
const utilsRoutes = require('./routes/utils.routes');

const app = express();

// --- Middlewares ---
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// --- Mount Routes ---
// Public & Customer
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/marketplace/listings', marketplaceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/refunds', refundRoutes);

// Organizer
app.use('/api/organizers', organizerRoutes); // Public profile of organizer
app.use('/api/organizer/events', organizerEventRoutes);
app.use('/api/organizer/staffs', staffRoutes);
app.use('/api/organizer/stats', organizerStatRoutes);
app.use('/api/organizer/tickets', organizerTicketRoutes);
app.use('/api/organizer/merchandise', organizerMerchandiseRoutes);

// Admin
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/events', adminEventRoutes);
app.use('/api/admin/categories', adminCategoryRoutes);
app.use('/api/admin', adminFinanceRoutes); // points inside to /refunds, /payouts
app.use('/api/admin', adminSystemRoutes);  // points inside to /config, /fraud-alerts, /stats

// Staff
app.use('/api/staff', scannerRoutes);

// Utilities, AI, Web3
app.use('/api/ai', aiRoutes);
app.use('/api/metadata', metadataRoutes);
app.use('/api/utils', utilsRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Welcome to BAS-Ticket API');
});

// Chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
