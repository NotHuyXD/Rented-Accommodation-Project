const express = require('express');
const router = express.Router();
const promotionController = require('../controllers/promotion.controller');

router.get('/banners', promotionController.listBanners);
router.get('/vip-packages', promotionController.listVipPackages);
router.get('/coupons', promotionController.listCoupons);

module.exports = router;
