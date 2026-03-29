// backend/controllers/likeController.js
const Like = require('../models/like');
const Notificacion = require('../models/notificacion'); // 👈 IMPORTAR
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const likeController = {
    async toggleLike(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { proyecto_id } = req.params;
            
            const result = await Like.toggle(usuario_id, proyecto_id);
            
            // 👇 CREAR NOTIFICACIÓN SOLO SI SE DIO LIKE (no si se quitó)
            if (result.liked) {
                // Obtener información del proyecto y su dueño
                const proyectoQuery = await pool.query(
                    `SELECT p.creador_id, p.nombre, u.nombre_completo as emisor_nombre 
                     FROM proyectos p
                     JOIN usuarios u ON u.id = $1
                     WHERE p.id = $2`,
                    [usuario_id, proyecto_id]
                );
                
                if (proyectoQuery.rows.length > 0) {
                    const proyecto = proyectoQuery.rows[0];
                    
                    // Solo notificar si NO es el dueño del proyecto
                    if (proyecto.creador_id !== usuario_id) {
                        await Notificacion.create({
                            usuario_id: proyecto.creador_id, // dueño del proyecto
                            tipo: 'like',
                            emisor_id: usuario_id,
                            proyecto_id,
                            contenido: `le ha dado like a tu proyecto "${proyecto.nombre}"`
                        });
                        console.log('✅ Notificación de like creada');
                    }
                }
            }
            
            res.json({
                success: true,
                ...result
            });
            
        } catch (error) {
            console.error('Error en toggleLike:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    async checkLike(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { proyecto_id } = req.params;
            
            const liked = await Like.check(usuario_id, proyecto_id);
            
            res.json({
                success: true,
                liked
            });
            
        } catch (error) {
            console.error('Error en checkLike:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
};

module.exports = likeController;