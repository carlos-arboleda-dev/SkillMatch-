const pool = require('../config/db');

const InvitacionProyecto = {
    // Invitar a un usuario a un proyecto
    async invitar(proyecto_id, usuario_id, invitado_por) {
        const query = `
            INSERT INTO invitaciones_proyecto (proyecto_id, usuario_id, invitado_por, estado)
            VALUES ($1, $2, $3, 'pendiente')
            RETURNING *;
        `;
        const result = await pool.query(query, [proyecto_id, usuario_id, invitado_por]);
        return result.rows[0];
    },

    // Aceptar invitación
    async aceptarInvitacion(id, usuario_id) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Actualizar estado de la invitación
            await client.query(
                'UPDATE invitaciones_proyecto SET estado = $1 WHERE id = $2 AND usuario_id = $3',
                ['aceptada', id, usuario_id]
            );
            
            // Obtener proyecto_id
            const invitacion = await client.query(
                'SELECT proyecto_id FROM invitaciones_proyecto WHERE id = $1',
                [id]
            );
            
            // Agregar como miembro del proyecto
            await client.query(
                'INSERT INTO miembros_proyecto (proyecto_id, usuario_id) VALUES ($1, $2)',
                [invitacion.rows[0].proyecto_id, usuario_id]
            );
            
            await client.query('COMMIT');
            return true;
        } catch (error) {
            await client.query('ROLLBACK');
            throw error;
        } finally {
            client.release();
        }
    },

    // Rechazar invitación
    async rechazarInvitacion(id, usuario_id) {
        const query = `
            UPDATE invitaciones_proyecto 
            SET estado = 'rechazada' 
            WHERE id = $1 AND usuario_id = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [id, usuario_id]);
        return result.rows[0];
    },

    // Obtener invitaciones pendientes de un usuario
    async obtenerPendientes(usuario_id) {
        const query = `
            SELECT i.*, 
                   p.nombre as proyecto_nombre,
                   u.nombre_completo as invitado_por_nombre
            FROM invitaciones_proyecto i
            JOIN proyectos p ON i.proyecto_id = p.id
            JOIN usuarios u ON i.invitado_por = u.id
            WHERE i.usuario_id = $1 AND i.estado = 'pendiente'
            ORDER BY i.created_at DESC;
        `;
        const result = await pool.query(query, [usuario_id]);
        return result.rows;
    }
};

module.exports = InvitacionProyecto;