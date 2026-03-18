const express = require('express');
const router = express.Router();
const invitacionController = require('../controllers/invitacionController');
const { verificarToken } = require('../middleware/auth');

router.post('/', verificarToken, invitacionController.invitarAProyecto);
router.put('/:id/aceptar', verificarToken, invitacionController.aceptarInvitacion);
router.put('/:id/rechazar', verificarToken, invitacionController.rechazarInvitacion);
router.get('/pendientes', verificarToken, invitacionController.obtenerInvitacionesPendientes);

module.exports = router;