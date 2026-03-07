const Recomendacion = require('../models/recomendacion');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const recomendacionController = {
    // Obtener usuarios recomendados
    async recomendarUsuarios(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            
            // Obtener código estudiantil
            const userQuery = await pool.query(
                'SELECT codigo_estudiantil FROM usuarios WHERE id = $1',
                [decoded.userId]
            );
            
            if (userQuery.rows.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            const codigo_estudiantil = userQuery.rows[0].codigo_estudiantil;
            
            const limite = req.query.limite || 10;
            const usuarios = await Recomendacion.buscarPorIntereses(codigo_estudiantil, limite);
            
            res.json({
                success: true,
                usuarios: usuarios.map(u => ({
                    ...u,
                    afinidad: Math.min(100, Math.round((u.afinidad / 20) * 100))
                }))
            });
            
        } catch (error) {
            console.error('Error recomendando usuarios:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Buscar usuarios por palabra clave
    async buscarUsuarios(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            
            const userQuery = await pool.query(
                'SELECT codigo_estudiantil FROM usuarios WHERE id = $1',
                [decoded.userId]
            );
            
            const codigo_estudiantil = userQuery.rows[0].codigo_estudiantil;
            
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
            }
            
            const limite = req.query.limite || 20;
            const usuarios = await Recomendacion.buscarPorPalabra(q, codigo_estudiantil, limite);
            
            res.json({
                success: true,
                usuarios
            });
            
        } catch (error) {
            console.error('Error buscando usuarios:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Obtener proyectos recomendados
    async recomendarProyectos(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            
            const userQuery = await pool.query(
                'SELECT codigo_estudiantil FROM usuarios WHERE id = $1',
                [decoded.userId]
            );
            
            const codigo_estudiantil = userQuery.rows[0].codigo_estudiantil;
            
            const limite = req.query.limite || 5;
            const proyectos = await Recomendacion.proyectosRecomendados(codigo_estudiantil, limite);
            
            res.json({
                success: true,
                proyectos
            });
            
        } catch (error) {
            console.error('Error recomendando proyectos:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
};

module.exports = recomendacionController;