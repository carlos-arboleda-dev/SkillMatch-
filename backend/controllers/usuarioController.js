const pool = require('../config/db');
const jwt = require('jsonwebtoken');

const usuarioController = {
    // Buscar usuario por código estudiantil
    async buscarPorCodigo(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            
            const { codigo } = req.params;
            
            const query = `
                SELECT id, nombre_completo, correo_institucional, 
                       codigo_estudiantil, programa_academico
                FROM usuarios 
                WHERE codigo_estudiantil = $1
            `;
            
            const result = await pool.query(query, [codigo]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            res.json({
                success: true,
                usuario: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error buscando usuario:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },

    // Obtener perfil de usuario por ID
    async obtenerPerfil(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            
            const { id } = req.params;
            
            const query = `
                SELECT u.id, u.nombre_completo, u.correo_institucional, 
                       u.codigo_estudiantil, u.programa_academico, u.semestre,
                       p.ciudad, p.foto_perfil, p.telefono,
                       p.interes_academico, p.habilidades, p.rol_preferido
                FROM usuarios u
                LEFT JOIN perfil_academico p ON u.codigo_estudiantil = p.codigo_estudiantil
                WHERE u.id = $1
            `;
            
            const result = await pool.query(query, [id]);
            
            if (result.rows.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            res.json({
                success: true,
                usuario: result.rows[0]
            });
            
        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
};

module.exports = usuarioController;