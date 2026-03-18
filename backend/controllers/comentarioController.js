const Comentario = require('../models/comentario');
const jwt = require('jsonwebtoken');
const Notificacion = require('../models/notificacion'); 
const pool = require('../config/db');

const comentarioController = {
    // Crear comentario
    async crearComentario(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { contenido, proyecto_id } = req.body;
            
            if (!contenido || !proyecto_id) {
                return res.status(400).json({ error: 'Contenido y proyecto_id son requeridos' });
            }
            
            // Crear el comentario
            const comentario = await Comentario.create({
                contenido,
                usuario_id,
                proyecto_id
            });
            
            // 👇 CREAR NOTIFICACIÓN
            // Obtener información del proyecto
            const proyectoQuery = await pool.query(
                `SELECT p.creador_id, p.nombre 
                 FROM proyectos p
                 WHERE p.id = $1`,
                [proyecto_id]
            );
            
            if (proyectoQuery.rows.length > 0) {
                const proyecto = proyectoQuery.rows[0];
                
                // Solo notificar si NO es el dueño del proyecto
                if (proyecto.creador_id !== usuario_id) {
                    // Acortar el contenido para la notificación
                    const contenidoCorto = contenido.length > 50 
                        ? contenido.substring(0, 50) + '...' 
                        : contenido;
                    
                    await Notificacion.create({
                        usuario_id: proyecto.creador_id, // dueño del proyecto
                        tipo: 'comentario',
                        emisor_id: usuario_id,
                        proyecto_id,
                        contenido: `comentó en tu proyecto "${proyecto.nombre}": "${contenidoCorto}"`
                    });
                    console.log('✅ Notificación de comentario creada');
                }
            }
            
            // Obtener información del usuario para la respuesta
            const userQuery = await pool.query(
                'SELECT nombre_completo FROM usuarios WHERE id = $1',
                [usuario_id]
            );
            
            res.status(201).json({
                success: true,
                message: 'Comentario creado',
                comentario: {
                    ...comentario,
                    autor_nombre: userQuery.rows[0].nombre_completo
                }
            });
            
        } catch (error) {
            console.error('Error creando comentario:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },


    // Obtener comentarios de un proyecto
    async obtenerComentarios(req, res) {
        try {
            const { proyectoId } = req.params;
            
            const comentarios = await Comentario.findByProyecto(proyectoId);
            
            res.json({
                success: true,
                comentarios
            });
            
        } catch (error) {
            console.error('Error obteniendo comentarios:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Eliminar comentario
    async eliminarComentario(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { id } = req.params;
            
            const comentario = await Comentario.delete(id, usuario_id);
            
            if (!comentario) {
                return res.status(404).json({ error: 'Comentario no encontrado o no tienes permiso' });
            }
            
            res.json({
                success: true,
                message: 'Comentario eliminado'
            });
            
        } catch (error) {
            console.error('Error eliminando comentario:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
};

module.exports = comentarioController;