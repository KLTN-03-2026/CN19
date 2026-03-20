require('dotenv').config();
const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const eventRoutes = require('./routes/event.routes');
const organizerRoutes = require('./routes/organizer.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const ticketRoutes = require('./routes/ticket.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const transactionRoutes = require('./routes/transaction.routes');
const refundRoutes = require('./routes/refund.routes');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const categoryRoutes = require('./routes/category.routes');
const eventRoutes = require('./routes/event.routes');
const organizerRoutes = require('./routes/organizer.routes');
const orderRoutes = require('./routes/order.routes');
const paymentRoutes = require('./routes/payment.routes');
const ticketRoutes = require('./routes/ticket.routes');
const marketplaceRoutes = require('./routes/marketplace.routes');
const transactionRoutes = require('./routes/transaction.routes');
const refundRoutes = require('./routes/refund.routes');

const organizerEventRoutes = require('./routes/organizer-event.routes');
const staffRoutes = require('./routes/staff.routes');
const organizerStatRoutes = require('./routes/organizer-stat.routes');

const adminUserRoutes = require('./routes/admin-user.routes');
const adminEventRoutes = require('./routes/admin-event.routes');
const adminFinanceRoutes = require('./routes/admin-finance.routes');
const adminSystemRoutes = require('./routes/admin-system.routes');

const scannerRoutes = require('./routes/scanner.routes');

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/organizers', organizerRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/marketplace/listings', marketplaceRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/refunds', refundRoutes);

// Organizer routes
app.use('/api/organizer/events', organizerEventRoutes);
app.use('/api/organizer/staffs', staffRoutes);
app.use('/api/organizer/stats', organizerStatRoutes);

// Admin routes
app.use('/api/admin/users', adminUserRoutes);
app.use('/api/admin/events', adminEventRoutes);
app.use('/api/admin', adminFinanceRoutes); // pounts inside to /refunds, /payouts
app.use('/api/admin', adminSystemRoutes);  // points inside to /config, /fraud-alerts, /stats

// Staff routes
app.use('/api/staff', scannerRoutes);

// Test Route
app.get('/', (req, res) => {
  res.send('Welcome to BAS-Ticket API');
});

// Chạy server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
