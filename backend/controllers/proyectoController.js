// backend/controllers/proyectoController.js
const pool = require('../config/db');

const proyectoController = {
    // Obtener proyectos para el feed (con información del creador)
    async obtenerFeed(req, res) {
        try {
            const query = `
                SELECT 
                    p.id,
                    p.nombre,
                    p.descripcion,
                    p.duracion,
                    p.fecha_inicio,
                    p.numero_integrantes,
                    p.created_at,
                    u.id as creador_id,
                    u.nombre_completo as creador_nombre,
                    u.codigo_estudiantil,
                    u.programa_academico,
                    pf.foto_perfil,
                    -- Datos simulados para likes y comentarios (luego los haremos reales)
                    0 as likes,
                    0 as comentarios
                FROM proyectos p
                JOIN usuarios u ON p.creador_id = u.id
                LEFT JOIN perfil_academico pf ON u.codigo_estudiantil = pf.codigo_estudiantil
                ORDER BY p.created_at DESC
                LIMIT 20;
            `;
            
            const result = await pool.query(query);
            
            // Formatear los datos para el frontend
            const proyectos = result.rows.map(p => ({
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
                tiempo: calcularTiempoRelativo(p.created_at),
                categoria: determinarCategoria(p.nombre, p.descripcion),
                likes: Math.floor(Math.random() * 50) + 5, // Temporal: números aleatorios
                comentarios: Math.floor(Math.random() * 15) + 2 // Temporal
            }));
            
            res.json({
                success: true,
                proyectos
            });
            
        } catch (error) {
            console.error('Error obteniendo feed:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Obtener proyectos relacionados (podría interesarte)
    async obtenerRelacionados(req, res) {
        try {
            const { proyectoId } = req.params;
            
            const query = `
                SELECT 
                    p.id,
                    p.nombre,
                    p.descripcion,
                    p.creador_id,
                    u.nombre_completo as creador_nombre,
                    u.programa_academico,
                    p.created_at
                FROM proyectos p
                JOIN usuarios u ON p.creador_id = u.id
                WHERE p.id != $1
                ORDER BY RANDOM()
                LIMIT 3;
            `;
            
            const result = await pool.query(query, [proyectoId]);
            
            res.json({
                success: true,
                proyectos: result.rows
            });
            
        } catch (error) {
            console.error('Error obteniendo relacionados:', error);
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