const express = require('express');
const router = express.Router();
const notificacionController = require('../controllers/notificacionController');

// Todas las rutas requieren autenticación
router.get('/', notificacionController.obtenerNotificaciones);
router.get('/contar', notificacionController.contarNoLeidas);
router.put('/:id/leer', notificacionController.marcarLeida);
router.put('/leer-todas', notificacionController.marcarTodasLeidas);

module.exports = router;