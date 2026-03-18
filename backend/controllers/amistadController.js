const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const amistadController = {
    // Enviar solicitud de amistad
    async enviarSolicitud(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { amigo_id } = req.params;
            
            // Validar que no sea el mismo usuario
            if (parseInt(usuario_id) === parseInt(amigo_id)) {
                return res.status(400).json({ error: 'No puedes enviarte solicitud a ti mismo' });
            }
            
            // Verificar si ya existe una relación
            const checkQuery = `
                SELECT * FROM amistades 
                WHERE (usuario_id = $1 AND amigo_id = $2) 
                   OR (usuario_id = $2 AND amigo_id = $1)
            `;
            const checkResult = await client.query(checkQuery, [usuario_id, amigo_id]);
            
            if (checkResult.rows.length > 0) {
                const relacion = checkResult.rows[0];
                
                if (relacion.estado === 'aceptada') {
                    await client.query('ROLLBACK');
                    return res.status(400).json({ error: 'Ya son amigos' });
                } else if (relacion.estado === 'pendiente') {
                    if (relacion.usuario_id === usuario_id) {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ error: 'Ya enviaste una solicitud a este usuario' });
                    } else {
                        await client.query('ROLLBACK');
                        return res.status(400).json({ error: 'Este usuario ya te envió una solicitud' });
                    }
                }
            }
            
            // Crear nueva solicitud
            const query = `
                INSERT INTO amistades (usuario_id, amigo_id, estado)
                VALUES ($1, $2, 'pendiente')
                RETURNING *;
            `;
            await client.query(query, [usuario_id, amigo_id]);
            
            // Obtener nombre del remitente
            const userQuery = await client.query(
                'SELECT nombre_completo FROM usuarios WHERE id = $1',
                [usuario_id]
            );
            
            // Crear notificación
            await client.query(
                `INSERT INTO notificaciones (usuario_id, tipo, emisor_id, contenido)
                 VALUES ($1, 'solicitud_amistad', $2, $3)`,
                [amigo_id, usuario_id, `${userQuery.rows[0].nombre_completo} te ha enviado una solicitud de amistad`]
            );
            
            await client.query('COMMIT');
            
            res.json({ 
                success: true, 
                message: 'Solicitud enviada correctamente' 
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error enviando solicitud:', error);
            res.status(500).json({ error: 'Error del servidor' });
        } finally {
            client.release();
        }
    },

    // Obtener solicitudes pendientes
    async obtenerSolicitudesPendientes(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const query = `
                SELECT a.id, a.usuario_id, a.created_at,
                       u.nombre_completo, u.correo_institucional, u.programa_academico
                FROM amistades a
                JOIN usuarios u ON a.usuario_id = u.id
                WHERE a.amigo_id = $1 AND a.estado = 'pendiente'
                ORDER BY a.created_at DESC
            `;
            
            const result = await pool.query(query, [usuario_id]);
            
            res.json({
                success: true,
                solicitudes: result.rows
            });
            
        } catch (error) {
            console.error('Error obteniendo solicitudes:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Aceptar solicitud
    async aceptarSolicitud(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { amigo_id } = req.params;
            
            // Verificar que existe la solicitud
            const checkQuery = `
                SELECT * FROM amistades 
                WHERE usuario_id = $1 AND amigo_id = $2 AND estado = 'pendiente'
            `;
            const checkResult = await client.query(checkQuery, [amigo_id, usuario_id]);
            
            if (checkResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Solicitud no encontrada' });
            }
            
            // Actualizar la solicitud original
            await client.query(
                'UPDATE amistades SET estado = $1 WHERE usuario_id = $2 AND amigo_id = $3',
                ['aceptada', amigo_id, usuario_id]
            );
            
            // Crear la relación inversa
            await client.query(
                'INSERT INTO amistades (usuario_id, amigo_id, estado) VALUES ($1, $2, $3)',
                [usuario_id, amigo_id, 'aceptada']
            );
            
            // Obtener nombre para notificación
            const userQuery = await client.query(
                'SELECT nombre_completo FROM usuarios WHERE id = $1',
                [usuario_id]
            );
            
            // Notificación al aceptar
            await client.query(
                `INSERT INTO notificaciones (usuario_id, tipo, emisor_id, contenido)
                 VALUES ($1, 'amistad_aceptada', $2, $3)`,
                [amigo_id, usuario_id, `${userQuery.rows[0].nombre_completo} aceptó tu solicitud de amistad`]
            );
            
            // Marcar la notificación original como leída
            await client.query(
                `UPDATE notificaciones SET leido = true 
                 WHERE usuario_id = $1 AND emisor_id = $2 AND tipo = 'solicitud_amistad'`,
                [usuario_id, amigo_id]
            );
            
            await client.query('COMMIT');
            
            res.json({ 
                success: true, 
                message: 'Solicitud aceptada' 
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error aceptando solicitud:', error);
            res.status(500).json({ error: 'Error del servidor' });
        } finally {
            client.release();
        }
    },

    // Rechazar solicitud
    async rechazarSolicitud(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { amigo_id } = req.params;
            
            // Verificar que existe la solicitud
            const checkQuery = `
                SELECT * FROM amistades 
                WHERE usuario_id = $1 AND amigo_id = $2 AND estado = 'pendiente'
            `;
            const checkResult = await client.query(checkQuery, [amigo_id, usuario_id]);
            
            if (checkResult.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Solicitud no encontrada' });
            }
            
            // Actualizar solicitud a rechazada
            await client.query(
                'UPDATE amistades SET estado = $1 WHERE usuario_id = $2 AND amigo_id = $3',
                ['rechazada', amigo_id, usuario_id]
            );
            
            // Marcar la notificación como leída
            await client.query(
                `UPDATE notificaciones SET leido = true 
                 WHERE usuario_id = $1 AND emisor_id = $2 AND tipo = 'solicitud_amistad'`,
                [usuario_id, amigo_id]
            );
            
            await client.query('COMMIT');
            
            res.json({ 
                success: true, 
                message: 'Solicitud rechazada' 
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error rechazando solicitud:', error);
            res.status(500).json({ error: 'Error del servidor' });
        } finally {
            client.release();
        }
    }
};

module.exports = amistadController;