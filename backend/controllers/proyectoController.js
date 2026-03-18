const pool = require('../config/db');
const jwt = require('jsonwebtoken'); 


const proyectoController = {
    // Obtener proyectos para el feed
    async obtenerFeed(req, res) {
        try {
            console.log('🔵 Ejecutando obtenerFeed');
            
            const query = `
                SELECT 
                    p.id,
                    p.nombre,
                    p.descripcion,
                    p.duracion,
                    p.fecha_inicio,
                    p.numero_integrantes,
                    p.created_at,
                    p.likes_count,
                    p.comentarios_count,
                    u.id as creador_id,
                    u.nombre_completo as creador_nombre,
                    u.programa_academico,
                    pf.foto_perfil
                FROM proyectos p
                JOIN usuarios u ON p.creador_id = u.id
                LEFT JOIN perfil_academico pf ON u.codigo_estudiantil = pf.codigo_estudiantil
                ORDER BY p.created_at DESC
                LIMIT 20;
            `;
            
            const result = await pool.query(query);
            
            // Formatear los datos
            const proyectos = result.rows.map(p => {
                // Calcular tiempo relativo
                const tiempo = calcularTiempoRelativo(p.created_at);
                
                // Determinar categoría basada en el título/descripción
                const categoria = determinarCategoria(p.nombre, p.descripcion);
                
                return {
                    id: p.id,
                    titulo: p.nombre,
                    descripcion: p.descripcion,
                    duracion: p.duracion,
                    fecha_inicio: p.fecha_inicio,
                    integrantes: p.numero_integrantes,
                    autor: {
                        id: p.creador_id,
                        nombre: p.creador_nombre,
                        programa: p.programa_academico,
                        foto: p.foto_perfil
                    },
                    tiempo,
                    categoria,
                    likes: parseInt(p.likes_count) || 0,
                    comentarios: parseInt(p.comentarios_count) || 0
                };
            });
            
            res.json({
                success: true,
                proyectos
            });
            
        } catch (error) {
            console.error('Error en obtenerFeed:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Unirse a un proyecto
    async unirseAProyecto(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { proyecto_id } = req.params;
            
            // Verificar si el proyecto existe
            const proyectoQuery = await pool.query(
                'SELECT creador_id, nombre FROM proyectos WHERE id = $1',
                [proyecto_id]
            );
            
            if (proyectoQuery.rows.length === 0) {
                return res.status(404).json({ error: 'Proyecto no encontrado' });
            }
            
            const proyecto = proyectoQuery.rows[0];
            
            // Verificar que no sea el dueño
            if (proyecto.creador_id === usuario_id) {
                return res.status(400).json({ error: 'Eres el dueño del proyecto' });
            }
            
            // Aquí deberías crear una tabla de miembros_proyecto si no existe
            // Por ahora simulamos que se unió correctamente
            
            // 👇 CREAR NOTIFICACIÓN AL DUEÑO
            const Notificacion = require('../models/notificacion');
            await Notificacion.create({
                usuario_id: proyecto.creador_id,
                tipo: 'union',
                emisor_id: usuario_id,
                proyecto_id,
                contenido: `se ha unido a tu proyecto "${proyecto.nombre}"`
            });
            
            res.json({
                success: true,
                message: 'Te has unido al proyecto'
            });
            
        } catch (error) {
            console.error('Error al unirse:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
};

// Función auxiliar para calcular tiempo relativo
function calcularTiempoRelativo(fecha) {
    const ahora = new Date();
    const publicado = new Date(fecha);
    const diferenciaMs = ahora - publicado;
    const diferenciaMin = Math.floor(diferenciaMs / (1000 * 60));
    const diferenciaHoras = Math.floor(diferenciaMs / (1000 * 60 * 60));
    const diferenciaDias = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24));

    if (diferenciaMin < 60) {
        return `Hace ${diferenciaMin} min`;
    } else if (diferenciaHoras < 24) {
        return `Hace ${diferenciaHoras} h`;
    } else {
        return `Hace ${diferenciaDias} d`;
    }
}

// Función auxiliar para determinar categoría
function determinarCategoria(titulo, descripcion) {
    const texto = (titulo + ' ' + descripcion).toLowerCase();
    
    if (texto.includes('soft') || texto.includes('app') || texto.includes('program') || texto.includes('desarrollo')) {
        return { nombre: 'Software', icono: 'fa-code' };
    } else if (texto.includes('educ') || texto.includes('enseñ') || texto.includes('aprend')) {
        return { nombre: 'Educación', icono: 'fa-book' };
    } else if (texto.includes('cienc') || texto.includes('investig') || texto.includes('laborat')) {
        return { nombre: 'Ciencia', icono: 'fa-flask' };
    } else if (texto.includes('art') || texto.includes('diseñ') || texto.includes('creativ')) {
        return { nombre: 'Arte', icono: 'fa-paint-brush' };
    } else {
        return { nombre: 'General', icono: 'fa-folder' };
    }
}

module.exports = proyectoController;