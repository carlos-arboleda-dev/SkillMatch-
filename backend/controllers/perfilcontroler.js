// backend/controllers/perfilcontroler.js
const PerfilAcademico = require('../models/perfilacademico');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const perfilController = {
    // Guardar perfil académico
    async guardarPerfil(req, res) {
        try {
            // Obtener token del header
            const token = req.header('Authorization')?.replace('Bearer ', '');
            
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            // Verificar token y obtener datos del usuario
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            
            // Obtener código estudiantil del usuario desde la base de datos
            const userQuery = await pool.query(
                'SELECT codigo_estudiantil FROM usuarios WHERE id = $1',
                [decoded.userId]
            );
            
            if (userQuery.rows.length === 0) {
                return res.status(404).json({ error: 'Usuario no encontrado' });
            }
            
            const codigo_estudiantil = userQuery.rows[0].codigo_estudiantil;

            const { intereses, habilidades, tipo_proyecto, temas_gustan, rol_preferido } = req.body;

            // Validar rol preferido (es obligatorio en el frontend)
            if (!rol_preferido) {
                return res.status(400).json({ error: 'El rol preferido es obligatorio' });
            }

            // Guardar perfil
            const perfil = await PerfilAcademico.upsert({
                codigo_estudiantil,
                intereses: intereses || [],
                habilidades: habilidades || [],
                tipo_proyecto: tipo_proyecto || [],
                temas_gustan: temas_gustan || [],
                rol_preferido
            });

            res.json({
                success: true,
                message: 'Perfil académico guardado exitosamente',
                perfil
            });

        } catch (error) {
            console.error('Error guardando perfil:', error);
            
            if (error.name === 'JsonWebTokenError') {
                return res.status(401).json({ error: 'Token inválido' });
            }
            
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    },

    // Obtener perfil del usuario actual
    async obtenerPerfil(req, res) {
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
            const perfil = await PerfilAcademico.findByCodigo(codigo_estudiantil);

            res.json({
                success: true,
                perfil: perfil || {}
            });

        } catch (error) {
            console.error('Error obteniendo perfil:', error);
            res.status(500).json({ error: 'Error interno del servidor' });
        }
    }
};

module.exports = perfilController;