const express = require('express');
const router = express.Router();
const invitacionController = require('../controllers/invitacionController');
const { verificarToken } = require('../middleware/auth');

console.log('🟢 Configurando rutas de invitaciones...');

// Ruta para aceptar una invitación
router.put('/:id/aceptar', verificarToken, invitacionController.aceptarInvitacion);

// Ruta para rechazar una invitación
router.put('/:id/rechazar', verificarToken, invitacionController.rechazarInvitacion);

// Ruta para crear una invitación
router.post('/', verificarToken, invitacionController.invitarAProyecto);

// Ruta para obtener invitaciones pendientes
router.get('/pendientes', verificarToken, invitacionController.obtenerInvitacionesPendientes);

console.log('✅ Rutas de invitaciones configuradas:');
console.log('   - PUT /:id/aceptar');
console.log('   - PUT /:id/rechazar');
console.log('   - POST /');
console.log('   - GET /pendientes');

module.exports = router;