const express = require('express');
const router = express.Router();
const usuarioController = require('../controllers/usuarioController');
const { verificarToken } = require('../middleware/auth');

router.get('/codigo/:codigo', verificarToken, usuarioController.buscarPorCodigo);
router.get('/:id', verificarToken, usuarioController.obtenerPerfil);

module.exports = router;