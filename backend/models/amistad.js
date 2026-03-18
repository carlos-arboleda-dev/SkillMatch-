const pool = require('../config/db');

const Amistad = {
    // Enviar solicitud de amistad
    async enviarSolicitud(usuario_id, amigo_id) {
        const query = `
            INSERT INTO amistades (usuario_id, amigo_id, estado)
            VALUES ($1, $2, 'pendiente')
            RETURNING *;
        `;
        const result = await pool.query(query, [usuario_id, amigo_id]);
        return result.rows[0];
    },

    // Aceptar solicitud
    async aceptarSolicitud(usuario_id, amigo_id) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            // Actualizar la solicitud original
            await client.query(
                'UPDATE amistades SET estado = $1 WHERE usuario_id = $2 AND amigo_id = $3',
                ['aceptada', amigo_id, usuario_id] // quien envió = amigo_id, quien acepta = usuario_id
            );
            
            // Crear la relación inversa
            await client.query(
                'INSERT INTO amistades (usuario_id, amigo_id, estado) VALUES ($1, $2, $3)',
                [usuario_id, amigo_id, 'aceptada']
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

    // Rechazar solicitud
    async rechazarSolicitud(usuario_id, amigo_id) {
        const query = `
            UPDATE amistades 
            SET estado = 'rechazada' 
            WHERE usuario_id = $1 AND amigo_id = $2
            RETURNING *;
        `;
        const result = await pool.query(query, [amigo_id, usuario_id]); // quien envió = amigo_id
        return result.rows[0];
    },

    // Verificar si son amigos
    async sonAmigos(usuario_id, otro_id) {
        const query = `
            SELECT * FROM amistades 
            WHERE usuario_id = $1 AND amigo_id = $2 AND estado = 'aceptada'
        `;
        const result = await pool.query(query, [usuario_id, otro_id]);
        return result.rows.length > 0;
    },

    // Obtener amigos de un usuario
    async obtenerAmigos(usuario_id) {
        const query = `
            SELECT u.id, u.nombre_completo, u.correo_institucional, u.programa_academico,
                   p.foto_perfil
            FROM amistades a
            JOIN usuarios u ON a.amigo_id = u.id
            LEFT JOIN perfil_academico p ON u.codigo_estudiantil = p.codigo_estudiantil
            WHERE a.usuario_id = $1 AND a.estado = 'aceptada'
            ORDER BY u.nombre_completo;
        `;
        const result = await pool.query(query, [usuario_id]);
        return result.rows;
    },

    // Obtener solicitudes pendientes
    async obtenerSolicitudesPendientes(usuario_id) {
        const query = `
            SELECT a.*, u.nombre_completo, u.correo_institucional, u.programa_academico
            FROM amistades a
            JOIN usuarios u ON a.usuario_id = u.id
            WHERE a.amigo_id = $1 AND a.estado = 'pendiente'
            ORDER BY a.created_at DESC;
        `;
        const result = await pool.query(query, [usuario_id]);
        return result.rows;
    }
};

module.exports = Amistad;