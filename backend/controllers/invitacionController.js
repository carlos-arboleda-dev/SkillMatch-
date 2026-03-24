const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const invitacionController = {
    async invitarAProyecto(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ error: 'Token requerido' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { proyecto_id, usuario_invitado } = req.body;
            
            if (!proyecto_id || !usuario_invitado) {
                return res.status(400).json({ error: 'Faltan datos requeridos' });
            }
            
            const proyectoQuery = await client.query(
                'SELECT id, nombre, creador_id FROM proyectos WHERE id = $1',
                [proyecto_id]
            );
            
            if (proyectoQuery.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }
            
            const proyecto = proyectoQuery.rows[0];
            
            if (proyecto.creador_id !== usuario_id) {
                await client.query('ROLLBACK');
                return res.status(403).json({ error: 'No tienes permiso para invitar a este proyecto' });
            }
            
            if (usuario_invitado === usuario_id) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'No puedes invitarte a ti mismo' });
            }
            
            const checkQuery = await client.query(
                'SELECT * FROM invitaciones_proyecto WHERE proyecto_id = $1 AND usuario_id = $2 AND estado = $3',
                [proyecto_id, usuario_invitado, 'pendiente']
            );
            
            if (checkQuery.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Ya existe una invitación pendiente para este usuario' });
            }
            
            const miembroQuery = await client.query(
                'SELECT * FROM miembros_proyecto WHERE proyecto_id = $1 AND usuario_id = $2',
                [proyecto_id, usuario_invitado]
            );
            
            if (miembroQuery.rows.length > 0) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'El usuario ya es miembro del proyecto' });
            }
            
            const invitacionQuery = `
                INSERT INTO invitaciones_proyecto (proyecto_id, usuario_id, invitado_por, estado)
                VALUES ($1, $2, $3, 'pendiente')
                RETURNING id
            `;
            const invitacionResult = await client.query(invitacionQuery, [proyecto_id, usuario_invitado, usuario_id]);
            
            const userQuery = await client.query(
                'SELECT nombre_completo FROM usuarios WHERE id = $1',
                [usuario_id]
            );
            
            await client.query(
                `INSERT INTO notificaciones (usuario_id, tipo, emisor_id, proyecto_id, contenido)
                 VALUES ($1, 'invitacion_proyecto', $2, $3, $4)`,
                [usuario_invitado, usuario_id, proyecto_id,
                 `${userQuery.rows[0].nombre_completo} te ha invitado al proyecto "${proyecto.nombre}"`]
            );
            
            await client.query('COMMIT');
            
            res.json({ 
                success: true, 
                message: 'Invitación enviada correctamente',
                invitacionId: invitacionResult.rows[0].id
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error enviando invitación:', error);
            res.status(500).json({ error: 'Error del servidor' });
        } finally {
            client.release();
        }
    },

    async aceptarInvitacion(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ error: 'Token requerido' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { id } = req.params; // este es proyecto_id
            
            // Buscar invitación por proyecto_id + usuario_id
            const invitacionQuery = await client.query(
                `SELECT * FROM invitaciones_proyecto 
                 WHERE proyecto_id = $1 AND usuario_id = $2 AND estado = 'pendiente'`,
                [id, usuario_id]
            );
            
            if (invitacionQuery.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Invitación no encontrada' });
            }
            
            const invitacion = invitacionQuery.rows[0];
            
            await client.query(
                'UPDATE invitaciones_proyecto SET estado = $1 WHERE id = $2',
                ['aceptada', invitacion.id]
            );
            
            await client.query(
                'INSERT INTO miembros_proyecto (proyecto_id, usuario_id) VALUES ($1, $2)',
                [invitacion.proyecto_id, usuario_id]
            );
            
            const proyectoQuery = await client.query(
                'SELECT nombre FROM proyectos WHERE id = $1',
                [invitacion.proyecto_id]
            );
            
            const userQuery = await client.query(
                'SELECT nombre_completo FROM usuarios WHERE id = $1',
                [usuario_id]
            );
            
            await client.query(
                `INSERT INTO notificaciones (usuario_id, tipo, emisor_id, proyecto_id, contenido)
                 VALUES ($1, 'invitacion_aceptada', $2, $3, $4)`,
                [invitacion.invitado_por, usuario_id, invitacion.proyecto_id,
                 `${userQuery.rows[0].nombre_completo} aceptó tu invitación al proyecto "${proyectoQuery.rows[0].nombre}"`]
            );
            
            await client.query('COMMIT');
            
            res.json({ 
                success: true, 
                message: 'Invitación aceptada. Te has unido al proyecto.' 
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error aceptando invitación:', error);
            res.status(500).json({ error: 'Error del servidor' });
        } finally {
            client.release();
        }
    },

    async rechazarInvitacion(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ error: 'Token requerido' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { id } = req.params; // este es proyecto_id
            
            // Buscar invitación por proyecto_id + usuario_id
            const invitacionQuery = await client.query(
                `SELECT * FROM invitaciones_proyecto 
                 WHERE proyecto_id = $1 AND usuario_id = $2 AND estado = 'pendiente'`,
                [id, usuario_id]
            );
            
            if (invitacionQuery.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Invitación no encontrada' });
            }
            
            const invitacion = invitacionQuery.rows[0];
            
            await client.query(
                'UPDATE invitaciones_proyecto SET estado = $1 WHERE id = $2',
                ['rechazada', invitacion.id]
            );
            
            const userQuery = await client.query(
                'SELECT nombre_completo FROM usuarios WHERE id = $1',
                [usuario_id]
            );
            
            await client.query(
                `INSERT INTO notificaciones (usuario_id, tipo, emisor_id, contenido)
                 VALUES ($1, 'invitacion_rechazada', $2, $3)`,
                [invitacion.invitado_por, usuario_id,
                 `${userQuery.rows[0].nombre_completo} rechazó tu invitación`]
            );
            
            await client.query('COMMIT');
            
            res.json({ 
                success: true, 
                message: 'Invitación rechazada' 
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error rechazando invitación:', error);
            res.status(500).json({ error: 'Error del servidor' });
        } finally {
            client.release();
        }
    },

    async obtenerInvitacionesPendientes(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ error: 'Token requerido' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const query = `
                SELECT i.*, p.nombre as proyecto_nombre, u.nombre_completo as invitado_por_nombre
                FROM invitaciones_proyecto i
                JOIN proyectos p ON i.proyecto_id = p.id
                JOIN usuarios u ON i.invitado_por = u.id
                WHERE i.usuario_id = $1 AND i.estado = 'pendiente'
                ORDER BY i.created_at DESC
            `;
            
            const result = await pool.query(query, [usuario_id]);
            
            res.json({
                success: true,
                invitaciones: result.rows
            });
            
        } catch (error) {
            console.error('Error obteniendo invitaciones:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
};

module.exports = invitacionController;