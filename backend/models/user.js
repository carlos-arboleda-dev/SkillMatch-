// backend/models/User.js
const pool = require('../config/db');

const User = {
    // Crear un nuevo usuario
    async create({ nombre_completo, correo, codigo, programa, semestre, password_hash }) {
        const query = `
            INSERT INTO usuarios 
            (nombre_completo, correo_institucional, codigo_estudiantil, programa_academico, semestre, contrasena_hash)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, correo_institucional, nombre_completo;
        `;
        const values = [nombre_completo, correo, codigo, programa, semestre, password_hash];
        
        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error en User.create:', error);
            throw error;
        }
    },

    // Buscar usuario por correo
    async findByEmail(correo) {
        const query = 'SELECT * FROM usuarios WHERE correo_institucional = $1';
        const result = await pool.query(query, [correo]);
        return result.rows[0];
    },

    // Buscar usuario por código estudiantil
    async findByCodigo(codigo) {
        const query = 'SELECT * FROM usuarios WHERE codigo_estudiantil = $1';
        const result = await pool.query(query, [codigo]);
        return result.rows[0];
    },

    // Buscar usuario por email o código (para login)
    async findByEmailOrCodigo(identificador) {
        const query = `
            SELECT * FROM usuarios 
            WHERE correo_institucional = $1 OR codigo_estudiantil = $1
        `;
        const result = await pool.query(query, [identificador]);
        return result.rows[0];
    }
};

module.exports = User;