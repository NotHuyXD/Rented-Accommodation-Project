// ============================================================
// Favorite Routes
// ============================================================
const express = require('express');
const router = express.Router();
const favoriteController = require('../controllers/favorite.controller');
const { authenticate } = require('../middleware/auth');

// Favorites
router.get('/', authenticate, favoriteController.listFavorites);
router.post('/toggle', authenticate, favoriteController.toggleFavorite);
router.get('/check/:roomId', authenticate, favoriteController.checkFavorite);
router.delete('/:roomId', authenticate, favoriteController.removeFavorite);

// Wishlist Collections
router.get('/collections', authenticate, favoriteController.listCollections);
router.post('/collections', authenticate, favoriteController.createCollection);
router.post('/collections/:collectionId/items', authenticate, favoriteController.addToCollection);
router.delete('/collections/:collectionId/items/:roomId', authenticate, favoriteController.removeFromCollection);

module.exports = router;
