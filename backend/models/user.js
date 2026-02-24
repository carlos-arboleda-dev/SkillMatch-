// backend/models/User.js
const pool = require('../config/db');

const User = {
    async create({ nombre_completo, correo, codigo, programa, semestre, password_hash }) {
        const query = `
            INSERT INTO usuarios 
            (nombre_completo, correo_institucional, codigo_estudiantil, programa_academico, semestre, contrasena_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, correo_institucional;
        `;
        const values = [nombre_completo, correo, codigo, programa, semestre, password_hash];
        const result = await pool.query(query, values);
        return result.rows[0];
    },

    async findByEmail(correo) {
        const query = 'SELECT * FROM usuarios WHERE correo_institucional = $1';
        const result = await pool.query(query, [correo]);
        return result.rows[0];
    }
};

module.exports = User;