const express = require('express');
const router = express.Router();
const cmsController = require('../controllers/cms.controller');

router.get('/articles', cmsController.listArticles);
router.get('/articles/:slug', cmsController.getArticleBySlug);
router.get('/faqs', cmsController.listFaqs);

// Admin
// router.post('/articles', authenticate, authorize('admin', 'super_admin'), cmsController.createArticle);

module.exports = router;
