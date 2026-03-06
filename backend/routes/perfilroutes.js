// backend/routes/perfilRoutes.js
const express = require('express');
const router = express.Router();
const perfilController = require('../controllers/perfilcontroler');

// Rutas para perfil académico
router.post('/guardar', perfilController.guardarPerfil);
router.get('/obtener', perfilController.obtenerPerfil);
router.put('/actualizar', perfilController.actualizarPerfil);  // 👈 DEBE SER PUT


module.exports = router;