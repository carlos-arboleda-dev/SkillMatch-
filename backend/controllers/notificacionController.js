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
            
            const limite = req.query.limite || 20;
            const notificaciones = await Notificacion.findByUsuario(usuario_id, limite);
            const noLeidas = await Notificacion.contarNoLeidas(usuario_id);
            
            res.json({
                success: true,
                noLeidas,
                notificaciones
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
    }
};

module.exports = notificacionController;