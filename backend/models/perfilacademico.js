// backend/models/perfilacademico.js
const pool = require('../config/db');

const PerfilAcademico = {
    // Crear o actualizar perfil usando código estudiantil
    async upsert({ codigo_estudiantil, intereses, habilidades, tipo_proyecto, temas_gustan, rol_preferido }) {
        
        // Verificar si ya existe
        const existeQuery = 'SELECT id FROM perfil_academico WHERE codigo_estudiantil = $1';
        const existe = await pool.query(existeQuery, [codigo_estudiantil]);
        
        // Convertir arrays a formato PostgreSQL (manejar null o undefined)
        const interesesArray = intereses || [];
        const habilidadesArray = habilidades || [];
        const tipoProyectoArray = tipo_proyecto || [];
        const temasArray = temas_gustan || [];
        
        if (existe.rows.length > 0) {
            // Actualizar
            const query = `
                UPDATE perfil_academico 
                SET interes_academico = $2, 
                    habilidades = $3, 
                    tipo_proyecto = $4, 
                    temas_gustan = $5, 
                    rol_preferido = $6
                WHERE codigo_estudiantil = $1
                RETURNING *;
            `;
            const values = [codigo_estudiantil, interesesArray, habilidadesArray, 
                          tipoProyectoArray, temasArray, rol_preferido];
            const result = await pool.query(query, values);
            return result.rows[0];
        } else {
            // Insertar
            const query = `
                INSERT INTO perfil_academico 
                (codigo_estudiantil, interes_academico, habilidades, tipo_proyecto, temas_gustan, rol_preferido)
                VALUES ($1, $2, $3, $4, $5, $6)
                RETURNING *;
            `;
            const values = [codigo_estudiantil, interesesArray, habilidadesArray, 
                          tipoProyectoArray, temasArray, rol_preferido];
            const result = await pool.query(query, values);
            return result.rows[0];
        }
    },

    // Obtener perfil por código estudiantil
    async findByCodigo(codigo_estudiantil) {
        const query = 'SELECT * FROM perfil_academico WHERE codigo_estudiantil = $1';
        const result = await pool.query(query, [codigo_estudiantil]);
        return result.rows[0];
    }
};

module.exports = PerfilAcademico;