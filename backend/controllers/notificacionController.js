const pool = require('../config/db');
const Notificacion = require('../models/notificacion');
const jwt = require('jsonwebtoken');

const notificacionController = {
    // Obtener notificaciones del usuario
    async obtenerNotificaciones(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            console.log('🔍 Usuario autenticado ID:', usuario_id);
            
            const query = `
                SELECT n.id, n.usuario_id, n.tipo, n.emisor_id, n.proyecto_id, 
                    n.contenido, n.leido, n.created_at,
                    u.nombre_completo as emisor_nombre,
                    u.codigo_estudiantil as emisor_codigo,
                    p.nombre as proyecto_nombre
                FROM notificaciones n
                LEFT JOIN usuarios u ON n.emisor_id = u.id
                LEFT JOIN proyectos p ON n.proyecto_id = p.id
                WHERE n.usuario_id = $1
                ORDER BY n.created_at DESC
                LIMIT 50
            `;
            
            const result = await pool.query(query, [usuario_id]);
            console.log(`📊 Encontradas ${result.rows.length} notificaciones para usuario ${usuario_id}`);
            
            res.json({
                success: true,
                notificaciones: result.rows
            });
            
        } catch (error) {
            console.error('Error obteniendo notificaciones:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Marcar notificación como leída
    async marcarLeida(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { id } = req.params;
            
            const notificacion = await Notificacion.marcarComoLeida(id, usuario_id);
            
            if (!notificacion) {
                return res.status(404).json({ error: 'Notificación no encontrada' });
            }
            
            res.json({ success: true });
            
        } catch (error) {
            console.error('Error marcando notificación:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Marcar todas como leídas
    async marcarTodasLeidas(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            await Notificacion.marcarTodasComoLeidas(usuario_id);
            
            res.json({ success: true });
            
        } catch (error) {
            console.error('Error marcando todas como leídas:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Obtener contador de no leídas
    async contarNoLeidas(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const count = await Notificacion.contarNoLeidas(usuario_id);
            
            res.json({
                success: true,
                noLeidas: count
            });
            
        } catch (error) {
            console.error('Error contando no leídas:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // backend/controllers/notificacionController.js

    // Eliminar una notificación
async eliminarNotificacion(req, res) {
    try {
        console.log('🔵 Eliminando notificación ID:', req.params.id);
        
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            console.log('❌ Token no proporcionado');
            return res.status(401).json({ error: 'Token requerido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
        const usuario_id = decoded.userId;
        console.log('✅ Usuario ID:', usuario_id);
        
        const { id } = req.params;
        
        if (!id) {
            console.log('❌ ID no proporcionado');
            return res.status(400).json({ error: 'ID de notificación requerido' });
        }
        
        // Verificar que la notificación pertenece al usuario
        const notificacion = await pool.query(
            'SELECT * FROM notificaciones WHERE id = $1 AND usuario_id = $2',
            [id, usuario_id]
        );
        
        console.log('📊 Notificación encontrada:', notificacion.rows.length);
        
        if (notificacion.rows.length === 0) {
            console.log('❌ Notificación no encontrada o no pertenece al usuario');
            return res.status(404).json({ error: 'Notificación no encontrada' });
        }
        
        // Eliminar la notificación
        await pool.query(
            'DELETE FROM notificaciones WHERE id = $1',
            [id]
        );
        
        console.log('✅ Notificación eliminada exitosamente');
        
        res.json({ 
            success: true, 
            message: 'Notificación eliminada' 
        });
        
    } catch (error) {
        console.error('❌ Error eliminando notificación:', error);
        console.error('❌ Detalle del error:', error.message);
        res.status(500).json({ error: 'Error del servidor: ' + error.message });
    }
}
};

module.exports = notificacionController;