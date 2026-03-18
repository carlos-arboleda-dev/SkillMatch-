const express = require('express');
const router = express.Router();
const amistadController = require('../controllers/amistadController');
const { verificarToken } = require('../middleware/auth');

// Verifica que todas las funciones existan en amistadController
router.post('/solicitud/:amigo_id', verificarToken, amistadController.enviarSolicitud);
router.get('/solicitudes-pendientes', verificarToken, amistadController.obtenerSolicitudesPendientes);
router.put('/aceptar/:amigo_id', verificarToken, amistadController.aceptarSolicitud);
router.put('/rechazar/:amigo_id', verificarToken, amistadController.rechazarSolicitud);

module.exports = router;