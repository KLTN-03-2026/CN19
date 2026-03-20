const express = require('express');
const router = express.Router();
const controller = require('../controllers/metadata.controller');

// [GET] /api/metadata/:tokenId
// Lưu ý: Route này bắt buộc không bảo vệ Auth, vì các sàn NFT (như Opensea) sẽ fetch trực tiếp để lấy Meta
router.get('/:tokenId', controller.getMetadata);

module.exports = router;
