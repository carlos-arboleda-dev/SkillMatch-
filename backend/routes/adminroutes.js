// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// Todas las rutas requieren autenticación y rol admin
router.use(verificarToken, verificarAdmin);

// Dashboard
router.get('/estadisticas', adminController.obtenerEstadisticas);

// Usuarios
router.get('/usuarios', adminController.obtenerUsuarios);
router.put('/usuarios/:id/rol', adminController.cambiarRol);
router.put('/usuarios/:id/estado', adminController.cambiarEstadoUsuario);
router.put('/usuarios/:id/reset-password', adminController.resetearPassword);

// Proyectos
router.get('/proyectos', adminController.obtenerProyectos);
router.put('/proyectos/:id/estado', adminController.cambiarEstadoProyecto);
router.delete('/proyectos/:id', adminController.eliminarProyecto);

// 🔵 NUEVO: Proyectos pendientes para revisión
router.get('/proyectos-pendientes', adminController.obtenerProyectosPendientes);
router.put('/proyectos/:id/revisar', adminController.revisarProyecto);

// Exportar
router.get('/exportar/:tipo', adminController.exportarDatos);

module.exports = router;