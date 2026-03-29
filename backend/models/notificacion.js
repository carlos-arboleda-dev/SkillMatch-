const pool = require('../config/db');

const Notificacion = {
    // Crear una notificación
    async create({ usuario_id, tipo, emisor_id, proyecto_id = null, contenido }) {
        const query = `
            INSERT INTO notificaciones (usuario_id, tipo, emisor_id, proyecto_id, contenido)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, usuario_id, tipo, emisor_id, proyecto_id, contenido, leido, created_at;
        `;
        const values = [usuario_id, tipo, emisor_id, proyecto_id, contenido];
        
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error en Notificacion.create:', error);
            throw error;
        }
    },

    // Obtener notificaciones de un usuario
    async findByUsuario(usuario_id, limite = 20) {
        const query = `
            SELECT n.*, 
                   u.nombre_completo as emisor_nombre,
                   u.codigo_estudiantil as emisor_codigo,
                   p.nombre as proyecto_nombre
            FROM notificaciones n
            JOIN usuarios u ON n.emisor_id = u.id
            LEFT JOIN proyectos p ON n.proyecto_id = p.id
            WHERE n.usuario_id = $1
            ORDER BY n.created_at DESC
            LIMIT $2;
        `;
        try {
            const result = await pool.query(query, [usuario_id, limite]);
            return result.rows;
        } catch (error) {
            console.error('Error en Notificacion.findByUsuario:', error);
            throw error;
        }
    },

    // Marcar notificación como leída
    async marcarComoLeida(id, usuario_id) {
        const query = `
            UPDATE notificaciones 
            SET leido = TRUE 
            WHERE id = $1 AND usuario_id = $2
            RETURNING id;
        `;
        try {
            const result = await pool.query(query, [id, usuario_id]);
            return result.rows[0];
        } catch (error) {
            console.error('Error en Notificacion.marcarComoLeida:', error);
            throw error;
        }
    },

    // Marcar todas como leídas
    async marcarTodasComoLeidas(usuario_id) {
        const query = `
            UPDATE notificaciones 
            SET leido = TRUE 
            WHERE usuario_id = $1 AND leido = FALSE;
        `;
        try {
            await pool.query(query, [usuario_id]);
        } catch (error) {
            console.error('Error en Notificacion.marcarTodasComoLeidas:', error);
            throw error;
        }
    },

    // Obtener contador de no leídas
    async contarNoLeidas(usuario_id) {
        const query = 'SELECT COUNT(*) FROM notificaciones WHERE usuario_id = $1 AND leido = FALSE';
        try {
            const result = await pool.query(query, [usuario_id]);
            return parseInt(result.rows[0].count);
        } catch (error) {
            console.error('Error en Notificacion.contarNoLeidas:', error);
            throw error;
        }
    }
};

module.exports = Notificacion;