// backend/routes/notificacionRoutes.js

const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');
const { verificarToken } = require('../middleware/auth');

router.get('/', verificarToken, notificacionController.obtenerNotificaciones);
router.get('/contar', verificarToken, notificacionController.contarNoLeidas);
router.put('/:id/leer', verificarToken, notificacionController.marcarLeida);
router.put('/leer-todas', verificarToken, notificacionController.marcarTodasLeidas);
router.delete('/:id', verificarToken, notificacionController.eliminarNotificacion); // 👈 NUEVA RUTA

module.exports = router;