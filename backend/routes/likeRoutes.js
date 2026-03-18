const express = require('express');
const router = express.Router();
const likeController = require('../controllers/likeController');

router.post('/proyecto/:proyecto_id/toggle', likeController.toggleLike);
router.get('/proyecto/:proyecto_id/check', likeController.checkLike);

module.exports = router;