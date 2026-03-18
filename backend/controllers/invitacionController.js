const InvitacionProyecto = require('../models/invitacionProyecto');
const Notificacion = require('../models/notificacion');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const invitacionController = {
    // Invitar a un usuario a un proyecto
    async invitarAProyecto(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const usuario_id = decoded.userId;
            
            const { proyecto_id, usuario_invitado } = req.body;
            
            // Verificar que el proyecto existe y el usuario es miembro/creador
            const proyectoQuery = await pool.query(
                'SELECT nombre FROM proyectos WHERE id = $1 AND creador_id = $2',
                [proyecto_id, usuario_id]
            );
            
            if (proyectoQuery.rows.length === 0) {
                return res.status(403).json({ error: 'No tienes permiso para invitar a este proyecto' });
            }
            
            const invitacion = await InvitacionProyecto.invitar(proyecto_id, usuario_invitado, usuario_id);
            
            // Crear notificación
            const userQuery = await pool.query('SELECT nombre_completo FROM usuarios WHERE id = $1', [usuario_id]);
            
            await Notificacion.create({
                usuario_id: usuario_invitado,
                tipo: 'invitacion_proyecto',
                emisor_id: usuario_id,
                proyecto_id,
                contenido: `${userQuery.rows[0].nombre_completo} te ha invitado al proyecto "${proyectoQuery.rows[0].nombre}"`
            });
            
            res.json({ success: true, message: 'Invitación enviada', invitacion });
            
        } catch (error) {
            console.error('Error enviando invitación:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Aceptar invitación
    async aceptarInvitacion(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const usuario_id = decoded.userId;
            
            const { id } = req.params;
            
            await InvitacionProyecto.aceptarInvitacion(id, usuario_id);
            
            res.json({ success: true, message: 'Invitación aceptada' });
            
        } catch (error) {
            console.error('Error aceptando invitación:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Rechazar invitación
    async rechazarInvitacion(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const usuario_id = decoded.userId;
            
            const { id } = req.params;
            
            await InvitacionProyecto.rechazarInvitacion(id, usuario_id);
            
            res.json({ success: true, message: 'Invitación rechazada' });
            
        } catch (error) {
            console.error('Error rechazando invitación:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Obtener invitaciones pendientes
    async obtenerInvitacionesPendientes(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const usuario_id = decoded.userId;
            
            const invitaciones = await InvitacionProyecto.obtenerPendientes(usuario_id);
            
            res.json({ success: true, invitaciones });
            
        } catch (error) {
            console.error('Error obteniendo invitaciones:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
};

module.exports = invitacionController;