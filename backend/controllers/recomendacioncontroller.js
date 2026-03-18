const Recomendacion = require('../models/recomendacion');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const recomendacionController = {
    // Obtener usuarios recomendados
    async recomendarUsuarios(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            
            // Obtener código estudiantil
            const userQuery = await pool.query(
                'SELECT codigo_estudiantil FROM usuarios WHERE id = $1',
                [decoded.userId]
            );
            
            if (userQuery.rows.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            const codigo_estudiantil = userQuery.rows[0].codigo_estudiantil;
            
            const limite = req.query.limite || 10;
            const usuarios = await Recomendacion.buscarPorIntereses(codigo_estudiantil, limite);
            
            res.json({
                success: true,
                usuarios: usuarios.map(u => ({
                    ...u,
                    afinidad: Math.min(100, Math.round((u.afinidad / 20) * 100))
                }))
            });
            
        } catch (error) {
            console.error('Error recomendando usuarios:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Buscar usuarios por palabra clave
    async buscarUsuarios(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            
            const userQuery = await pool.query(
                'SELECT codigo_estudiantil FROM usuarios WHERE id = $1',
                [decoded.userId]
            );
            
            const codigo_estudiantil = userQuery.rows[0].codigo_estudiantil;
            
            const { q } = req.query;
            if (!q) {
                return res.status(400).json({ error: 'Parámetro de búsqueda requerido' });
            }
            
            const limite = req.query.limite || 20;
            const usuarios = await Recomendacion.buscarPorPalabra(q, codigo_estudiantil, limite);
            
            res.json({
                success: true,
                usuarios
            });
            
        } catch (error) {
            console.error('Error buscando usuarios:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Obtener proyectos recomendados
    async recomendarProyectos(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            
            const userQuery = await pool.query(
                'SELECT codigo_estudiantil FROM usuarios WHERE id = $1',
                [decoded.userId]
            );
            
            const codigo_estudiantil = userQuery.rows[0].codigo_estudiantil;
            
            const limite = req.query.limite || 5;
            const proyectos = await Recomendacion.proyectosRecomendados(codigo_estudiantil, limite);
            
            res.json({
                success: true,
                proyectos
            });
            
        } catch (error) {
            console.error('Error recomendando proyectos:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    
    // Obtener proyectos recomendados basados en intereses del usuario
    async recomendarProyectosPorIntereses(req, res) {
        try {
            console.log('🔵 Iniciando recomendarProyectosPorIntereses');
            
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                console.log('❌ Token no proporcionado');
                return res.status(401).json({ error: 'Token requerido' });
            }
            console.log('✅ Token recibido');

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            console.log('✅ Token verificado, userId:', decoded.userId);
            
            // Obtener código estudiantil
            const userQuery = await pool.query(
                'SELECT codigo_estudiantil FROM usuarios WHERE id = $1',
                [decoded.userId]
            );
            
            if (userQuery.rows.length === 0) {
                console.log('❌ Usuario no encontrado');
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            const codigo_estudiantil = userQuery.rows[0].codigo_estudiantil;
            console.log('✅ Código estudiantil:', codigo_estudiantil);
            
            // Obtener intereses del usuario
            const perfilQuery = await pool.query(
                'SELECT interes_academico FROM perfil_academico WHERE codigo_estudiantil = $1',
                [codigo_estudiantil]
            );
            
            console.log('✅ Perfil query ejecutado, rows:', perfilQuery.rows.length);
            
            let intereses = [];
            if (perfilQuery.rows.length > 0 && perfilQuery.rows[0].interes_academico) {
                intereses = perfilQuery.rows[0].interes_academico;
                console.log('✅ Intereses encontrados:', intereses);
            } else {
                console.log('⚠️ No hay intereses, devolviendo proyectos recientes');
            }
            
            // Si no hay intereses, devolver proyectos recientes
            if (intereses.length === 0) {
                console.log('🟡 Ejecutando query de proyectos recientes');
                const proyectosQuery = await pool.query(`
                    SELECT p.id, p.nombre, p.descripcion, u.nombre_completo as autor,
                        p.created_at
                    FROM proyectos p
                    JOIN usuarios u ON p.creador_id = u.id
                    ORDER BY p.created_at DESC
                    LIMIT 5
                `);
                console.log('✅ Proyectos recientes encontrados:', proyectosQuery.rows.length);
                return res.json({ success: true, proyectos: proyectosQuery.rows });
            }
            
            // Versión simplificada SIN DISTINCT y SIN relevancia
            console.log('🟡 Ejecutando query de proyectos por intereses');
            
            const proyectosQuery = await pool.query(`
                SELECT p.id, p.nombre, p.descripcion, p.created_at,
                    u.nombre_completo as autor
                FROM proyectos p
                JOIN usuarios u ON p.creador_id = u.id
                WHERE p.nombre ILIKE ANY($1::text[])
                OR p.descripcion ILIKE ANY($1::text[])
                ORDER BY p.created_at DESC
                LIMIT 5
            `, [intereses.map(i => `%${i}%`)]);
            
            console.log('✅ Proyectos encontrados:', proyectosQuery.rows.length);
            
            // Si no hay proyectos con intereses, devolver recientes
            if (proyectosQuery.rows.length === 0) {
                console.log('⚠️ No hay proyectos con intereses, devolviendo recientes');
                const recientesQuery = await pool.query(`
                    SELECT p.id, p.nombre, p.descripcion, p.created_at,
                        u.nombre_completo as autor
                    FROM proyectos p
                    JOIN usuarios u ON p.creador_id = u.id
                    ORDER BY p.created_at DESC
                    LIMIT 5
                `);
                return res.json({ success: true, proyectos: recientesQuery.rows });
            }
            
            res.json({ success: true, proyectos: proyectosQuery.rows });
            
        } catch (error) {
            console.error('❌ Error en recomendarProyectosPorIntereses:', error);
            console.error('❌ Mensaje:', error.message);
            console.error('❌ Stack:', error.stack);
            res.status(500).json({ error: 'Error del servidor: ' + error.message });
        }
    }
};

// Exportar correctamente
module.exports = recomendacionController;