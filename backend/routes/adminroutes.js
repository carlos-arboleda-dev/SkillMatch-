// backend/routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const { verificarToken, verificarAdmin } = require('../middleware/auth');

// Todas las rutas de admin requieren autenticación y rol de admin
router.use(verificarToken, verificarAdmin);

// Obtener todos los usuarios
router.get('/usuarios', async (req, res) => {
    try {
        const result = await pool.query(`
            SELECT id, nombre_completo, correo_institucional, codigo_estudiantil, 
                   programa_academico, semestre, rol, created_at 
            FROM usuarios 
            ORDER BY created_at DESC
        `);
        res.json(result.rows);
    } catch (error) {
        console.error('Error obteniendo usuarios:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Activar/desactivar usuario (cambiar estado)
router.put('/usuarios/:id/estado', async (req, res) => {
    try {
        const { id } = req.params;
        const { activo } = req.body; // true o false
        
        // Agregar campo 'activo' a la tabla si no existe
        await pool.query(
            `INSERT INTO usuario_estado (usuario_id, activo, updated_at) 
             VALUES ($1, $2, NOW())
             ON CONFLICT (usuario_id) 
             DO UPDATE SET activo = $2, updated_at = NOW()`,
            [id, activo]
        );
        
        res.json({ message: 'Estado actualizado correctamente' });
    } catch (error) {
        console.error('Error actualizando estado:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Cambiar rol de usuario
router.put('/usuarios/:id/rol', async (req, res) => {
    try {
        const { id } = req.params;
        const { rol } = req.body; // 'admin' o 'estudiante'
        
        await pool.query(
            'UPDATE usuarios SET rol = $1 WHERE id = $2',
            [rol, id]
        );
        
        res.json({ message: 'Rol actualizado correctamente' });
    } catch (error) {
        console.error('Error actualizando rol:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

// Obtener estadísticas
router.get('/estadisticas', async (req, res) => {
    try {
        const totalUsuarios = await pool.query('SELECT COUNT(*) FROM usuarios');
        const estudiantes = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'estudiante'");
        const admins = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin'");
        
        res.json({
            totalUsuarios: parseInt(totalUsuarios.rows[0].count),
            estudiantes: parseInt(estudiantes.rows[0].count),
            admins: parseInt(admins.rows[0].count)
        });
    } catch (error) {
        console.error('Error obteniendo estadísticas:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
});

module.exports = router;