const pool = require('../config/db');
const bcrypt = require('bcrypt');

const adminController = {
    //obtener estadisticas
    async obtenerEstadisticas(req, res) {
        try {
            console.log('🔵 Obteniendo estadísticas...');
            
            // Totales básicos
            const totalUsuarios = await pool.query('SELECT COUNT(*) FROM usuarios');
            const estudiantes = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'estudiante' OR rol IS NULL");
            const admins = await pool.query("SELECT COUNT(*) FROM usuarios WHERE rol = 'admin'");
            const proyectos = await pool.query('SELECT COUNT(*) FROM proyectos');
            
            // Actividad de los últimos 6 meses
            const actividad = await pool.query(`
                SELECT 
                    TO_CHAR(DATE_TRUNC('month', created_at), 'Mon') as mes,
                    COUNT(*) as cantidad
                FROM usuarios
                WHERE created_at >= NOW() - INTERVAL '6 months'
                GROUP BY mes, DATE_TRUNC('month', created_at)
                ORDER BY DATE_TRUNC('month', created_at)
            `);
            
            console.log('Actividad encontrada:', actividad.rows);
            
            // Si no hay datos, usar datos de prueba
            let actividadLabels, actividadData;
            if (actividad.rows.length === 0) {
                actividadLabels = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'];
                actividadData = [2, 3, 4, 1, 2, 3];
            } else {
                actividadLabels = actividad.rows.map(r => r.mes);
                actividadData = actividad.rows.map(r => parseInt(r.cantidad));
            }
            
            // Categorías de proyectos
            const categorias = await pool.query(`
                SELECT 
                    CASE 
                        WHEN LOWER(nombre) LIKE '%software%' OR LOWER(nombre) LIKE '%app%' OR LOWER(nombre) LIKE '%program%' THEN 'Software'
                        WHEN LOWER(nombre) LIKE '%educ%' OR LOWER(nombre) LIKE '%enseñ%' THEN 'Educación'
                        WHEN LOWER(nombre) LIKE '%cienc%' OR LOWER(nombre) LIKE '%investig%' THEN 'Ciencia'
                        WHEN LOWER(nombre) LIKE '%art%' OR LOWER(nombre) LIKE '%diseñ%' THEN 'Arte'
                        ELSE 'Otros'
                    END as categoria,
                    COUNT(*) as cantidad
                FROM proyectos
                GROUP BY categoria
                ORDER BY cantidad DESC
                LIMIT 5
            `);
            
            console.log('Categorías encontradas:', categorias.rows);
            
            let categoriasLabels, categoriasData;
            if (categorias.rows.length === 0) {
                categoriasLabels = ['Software', 'Educación', 'Ciencia', 'Arte'];
                categoriasData = [5, 3, 2, 1];
            } else {
                categoriasLabels = categorias.rows.map(r => r.categoria);
                categoriasData = categorias.rows.map(r => parseInt(r.cantidad));
            }
            
            // Carreras más populares
            const carreras = await pool.query(`
                SELECT 
                    programa_academico as carrera, 
                    COUNT(*) as cantidad
                FROM usuarios
                WHERE programa_academico IS NOT NULL AND programa_academico != ''
                GROUP BY programa_academico
                ORDER BY cantidad DESC
                LIMIT 5
            `);
            
            console.log('Carreras encontradas:', carreras.rows);
            
            let carrerasLabels, carrerasData;
            if (carreras.rows.length === 0) {
                carrerasLabels = ['Ing. Sistemas', 'Electrónica', 'Civil', 'Biología', 'Derecho'];
                carrerasData = [8, 5, 4, 3, 2];
            } else {
                carrerasLabels = carreras.rows.map(r => r.carrera);
                carrerasData = carreras.rows.map(r => parseInt(r.cantidad));
            }
            
            const respuesta = {
                success: true,
                totalUsuarios: parseInt(totalUsuarios.rows[0].count),
                estudiantes: parseInt(estudiantes.rows[0].count),
                admins: parseInt(admins.rows[0].count),
                proyectos: parseInt(proyectos.rows[0].count),
                actividadLabels: actividadLabels,
                actividadData: actividadData,
                categoriasLabels: categoriasLabels,
                categoriasData: categoriasData,
                carrerasLabels: carrerasLabels,
                carrerasData: carrerasData
            };
            
            console.log('📊 Respuesta enviada:', respuesta);
            res.json(respuesta);
            
        } catch (error) {
            console.error('Error en obtenerEstadisticas:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Obtener todos los usuarios con estado basado en último login
    async obtenerUsuarios(req, res) {
        try {
            const result = await pool.query(`
                SELECT id, nombre_completo, correo_institucional, codigo_estudiantil, 
                    programa_academico, semestre, rol, created_at, ultimo_login, ultimo_logout,
                    CASE 
                        WHEN ultimo_login IS NULL THEN 'inactivo'
                        WHEN ultimo_logout IS NOT NULL AND ultimo_logout > ultimo_login THEN 'inactivo'
                        WHEN ultimo_login >= NOW() - INTERVAL '30 days' THEN 'activo'
                        ELSE 'inactivo'
                    END as estado_activo
                FROM usuarios
                ORDER BY ultimo_login DESC NULLS LAST, created_at DESC
            `);
            
            res.json(result.rows);
        } catch (error) {
            console.error('Error en obtenerUsuarios:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Activar/Desactivar usuario
    async cambiarEstadoUsuario(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;
            
            // Asegurar que la columna existe
            await pool.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE');
            
            await pool.query(
                'UPDATE usuarios SET activo = $1 WHERE id = $2',
                [activo, id]
            );
            
            res.json({ 
                success: true, 
                message: `Usuario ${activo ? 'activado' : 'desactivado'} correctamente`,
                estado: activo
            });
        } catch (error) {
            console.error('Error cambiando estado:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Cambiar rol de usuario
    async cambiarRol(req, res) {
        try {
            const { id } = req.params;
            const { rol } = req.body;
            
            if (!['estudiante', 'admin'].includes(rol)) {
                return res.status(400).json({ error: 'Rol inválido' });
            }
            
            await pool.query(
                'UPDATE usuarios SET rol = $1 WHERE id = $2',
                [rol, id]
            );
            
            res.json({ success: true, message: 'Rol actualizado correctamente' });
        } catch (error) {
            console.error('Error cambiando rol:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Obtener proyectos con estado
    async obtenerProyectos(req, res) {
        try {
            const result = await pool.query(`
                SELECT p.*, u.nombre_completo as creador_nombre,
                       p.estado,
                       COALESCE(p.activo, true) as activo,
                       (SELECT COUNT(*) FROM miembros_proyecto WHERE proyecto_id = p.id) as miembros_count
                FROM proyectos p
                JOIN usuarios u ON p.creador_id = u.id
                ORDER BY p.created_at DESC
            `);
            res.json(result.rows);
        } catch (error) {
            console.error('Error obteniendo proyectos:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Activar/Desactivar proyecto
    async cambiarEstadoProyecto(req, res) {
        try {
            const { id } = req.params;
            const { activo } = req.body;
            
            await pool.query('ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS activo BOOLEAN DEFAULT TRUE');
            
            await pool.query(
                'UPDATE proyectos SET activo = $1 WHERE id = $2',
                [activo, id]
            );
            
            res.json({ 
                success: true, 
                message: `Proyecto ${activo ? 'activado' : 'desactivado'} correctamente`,
                estado: activo
            });
        } catch (error) {
            console.error('Error cambiando estado proyecto:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Eliminar proyecto
    async eliminarProyecto(req, res) {
        try {
            const { id } = req.params;
            await pool.query('DELETE FROM proyectos WHERE id = $1', [id]);
            res.json({ success: true, message: 'Proyecto eliminado correctamente' });
        } catch (error) {
            console.error('Error eliminando proyecto:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // 🔵 NUEVO: Obtener proyectos pendientes de revisión
    async obtenerProyectosPendientes(req, res) {
        try {
            console.log('🔵 Obteniendo proyectos pendientes...');
            const result = await pool.query(`
                SELECT p.*, 
                       u.nombre_completo as creador_nombre,
                       u.correo_institucional as creador_correo
                FROM proyectos p
                JOIN usuarios u ON p.creador_id = u.id
                WHERE p.estado = 'pendiente'
                ORDER BY p.created_at DESC
            `);
            console.log(`📋 Encontrados ${result.rows.length} proyectos pendientes`);
            res.json(result.rows);
        } catch (error) {
            console.error('Error obteniendo proyectos pendientes:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // 🔵 NUEVO: Revisar proyecto (aceptar/rechazar)
    async revisarProyecto(req, res) {
        const client = await pool.connect();
        try {
            await client.query('BEGIN');
            
            const { id } = req.params;
            const { accion, motivo_rechazo } = req.body;
            const admin_id = req.user.userId;
            
            if (!['aceptar', 'rechazar'].includes(accion)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Acción inválida' });
            }
            
            if (accion === 'rechazar' && (!motivo_rechazo || motivo_rechazo.trim().length < 10)) {
                await client.query('ROLLBACK');
                return res.status(400).json({ error: 'Motivo de rechazo debe tener al menos 10 caracteres' });
            }
            
            // Verificar proyecto existe y está pendiente
            const proyecto = await client.query(
                'SELECT * FROM proyectos WHERE id = $1 AND estado = \'pendiente\'', 
                [id]
            );
            
            if (proyecto.rows.length === 0) {
                await client.query('ROLLBACK');
                return res.status(404).json({ error: 'Proyecto no encontrado o no está pendiente' });
            }
            
            const proyectoData = proyecto.rows[0];
            const nuevoEstado = accion === 'aceptar' ? 'aprobado' : 'rechazado';
            const mensaje = accion === 'aceptar' 
                ? `¡Tu proyecto "${proyectoData.nombre}" ha sido aprobado! 🎉`
                : `Tu proyecto "${proyectoData.nombre}" ha sido rechazado. Motivo: ${motivo_rechazo}`;
            
// Actualizar proyecto - FIX SQL params
            if (accion === 'aceptar') {
                await client.query(`
                    UPDATE proyectos 
                    SET estado = $1, revisado_por = $2, fecha_revision = NOW()
                    WHERE id = $3
                `, [nuevoEstado, admin_id, id]);
            } else {
                await client.query(`
                    UPDATE proyectos 
                    SET estado = $1, revisado_por = $2, fecha_revision = NOW(), motivo_rechazo = $3
                    WHERE id = $4
                `, [nuevoEstado, admin_id, motivo_rechazo, id]);
            }
            
            // Crear notificación al creador
            const Notificacion = require('../models/notificacion');
            await Notificacion.create({
                usuario_id: proyectoData.creador_id,
                tipo: 'revision_proyecto',
                emisor_id: admin_id,
                proyecto_id: parseInt(id),
                contenido: mensaje
            });
            
            await client.query('COMMIT');
            
            res.json({ 
                success: true, 
                message: `Proyecto ${nuevoEstado} correctamente`,
                estado: nuevoEstado
            });
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error revisando proyecto:', error);
            res.status(500).json({ error: 'Error del servidor' });
        } finally {
            client.release();
        }
    },

    // Resetear contraseña
    async resetearPassword(req, res) {
        try {
            const { id } = req.params;
            const { password } = req.body;
            
            if (!password || password.length < 6) {
                return res.status(400).json({ error: 'La contraseña debe tener al menos 6 caracteres' });
            }
            
            const hash = await bcrypt.hash(password, 10);
            await pool.query(
                'UPDATE usuarios SET contrasena_hash = $1 WHERE id = $2',
                [hash, id]
            );
            
            res.json({ success: true, message: 'Contraseña actualizada correctamente' });
        } catch (error) {
            console.error('Error resetando password:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Exportar datos
    async exportarDatos(req, res) {
        try {
            const { tipo } = req.params;
            
            if (tipo === 'usuarios') {
                const result = await pool.query(`
                    SELECT id, nombre_completo, correo_institucional, codigo_estudiantil, 
                           programa_academico, semestre, rol, activo, created_at
                    FROM usuarios
                    ORDER BY created_at DESC
                `);
                res.json(result.rows);
            } 
            else if (tipo === 'proyectos') {
                const result = await pool.query(`
                    SELECT p.id, p.nombre, p.descripcion, p.created_at, p.activo,
                           u.nombre_completo as creador_nombre,
                           (SELECT COUNT(*) FROM miembros_proyecto WHERE proyecto_id = p.id) as miembros
                    FROM proyectos p
                    JOIN usuarios u ON p.creador_id = u.id
                    ORDER BY p.created_at DESC
                `);
                res.json(result.rows);
            }
            else {
                res.status(400).json({ error: 'Tipo inválido' });
            }
        } catch (error) {
            console.error('Error exportando:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
};

module.exports = adminController;