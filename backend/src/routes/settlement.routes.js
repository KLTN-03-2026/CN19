const express = require('express');
const router = express.Router();
const SettlementController = require('../controllers/settlement.controller');
const { authenticate, authorize } = require('../middlewares/auth.middleware');

// --- Routes cho Organizer ---
router.get(
    '/organizer/events', 
    authenticate, 
    authorize('organizer'), 
    SettlementController.getOrganizerEvents
);
router.post(
    '/organizer/request', 
    authenticate, 
    authorize('organizer'), 
    SettlementController.requestSettlement
);

// --- Routes cho Admin ---
router.get(
    '/admin/requests', 
    authenticate, 
    authorize('admin'), 
    SettlementController.adminGetSettlements
);
router.post(
    '/admin/process/:id', 
    authenticate, 
    authorize('admin'), 
    SettlementController.adminProcessSettlement
);

module.exports = router;
