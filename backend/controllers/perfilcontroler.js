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

            // Validar rol preferido
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
    },

    // Actualizar perfil completo
    async actualizarPerfil(req, res) {
        
        
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
            
            // 👇 RECIBIR TODOS LOS CAMPOS, INCLUYENDO 'foto'
            const { 
                ciudad, telefono, correoRecuperacion, telefonoRecuperacion,
                intereses, habilidades, tipo_proyecto, temas_gustan, rol_preferido,
                semestre, foto  // 👈 AGREGAR 'foto' AQUÍ
            } = req.body;
            
            
            // Actualizar semestre en tabla usuarios
            if (semestre) {
                await pool.query(
                    'UPDATE usuarios SET semestre = $1 WHERE id = $2',
                    [semestre, decoded.userId]
                );
            }
            
            // Verificar si existe perfil
            const existePerfil = await pool.query(
                'SELECT * FROM perfil_academico WHERE codigo_estudiantil = $1',
                [codigo_estudiantil]
            );
            
            let perfil;
            
            if (existePerfil.rows.length > 0) {
                // Actualizar perfil existente
                const query = `
                    UPDATE perfil_academico 
                    SET 
                        interes_academico = COALESCE($2, interes_academico),
                        habilidades = COALESCE($3, habilidades),
                        tipo_proyecto = COALESCE($4, tipo_proyecto),
                        temas_gustan = COALESCE($5, temas_gustan),
                        rol_preferido = COALESCE($6, rol_preferido),
                        ciudad = COALESCE($7, ciudad),
                        telefono = COALESCE($8, telefono),
                        correo_recuperacion = COALESCE($9, correo_recuperacion),
                        telefono_recuperacion = COALESCE($10, telefono_recuperacion),
                        foto_perfil = COALESCE($11, foto_perfil)  /* 👈 NUEVO CAMPO */
                    WHERE codigo_estudiantil = $1
                    RETURNING *;
                `;
                
                const values = [
                    codigo_estudiantil, 
                    intereses || [],        // interes_academico
                    habilidades || [],       // habilidades
                    tipo_proyecto || [],     // tipo_proyecto
                    temas_gustan || [],      // temas_gustan
                    rol_preferido,           // rol_preferido
                    ciudad,                  // ciudad
                    telefono,                // telefono
                    correoRecuperacion,      // correo_recuperacion
                    telefonoRecuperacion,    // telefono_recuperacion
                    foto || null              // 👈 foto_perfil
                ];
                
                const result = await pool.query(query, values);
                perfil = result.rows[0];
            } else {
                // Crear nuevo perfil
                const query = `
                    INSERT INTO perfil_academico 
                    (codigo_estudiantil, interes_academico, habilidades, tipo_proyecto, 
                    temas_gustan, rol_preferido, ciudad, telefono, correo_recuperacion, 
                    telefono_recuperacion, foto_perfil)
                    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                    RETURNING *;
                `;
                
                const values = [
                    codigo_estudiantil,
                    intereses || [],
                    habilidades || [],
                    tipo_proyecto || [],
                    temas_gustan || [],
                    rol_preferido,
                    ciudad,
                    telefono,
                    correoRecuperacion,
                    telefonoRecuperacion,
                    foto || null  // 👈 foto_perfil
                ];
                
                const result = await pool.query(query, values);
                perfil = result.rows[0];
            }
            
            res.json({ 
                success: true, 
                message: 'Perfil actualizado correctamente',
                perfil 
            });
            
        } catch (error) {
            console.error('Error actualizando perfil:', error);
            res.status(500).json({ error: 'Error del servidor: ' + error.message });
        }
    }
};

module.exports = perfilController;