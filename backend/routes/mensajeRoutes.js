const express = require('express');
const router = express.Router();
const mensajeController = require('../controllers/mensajeController');
const { verificarToken } = require('../middleware/auth');

router.get('/chats', verificarToken, mensajeController.obtenerChats);
router.get('/:chat_id', verificarToken, mensajeController.obtenerMensajes);
router.post('/', verificarToken, mensajeController.enviarMensaje);

module.exports = router;