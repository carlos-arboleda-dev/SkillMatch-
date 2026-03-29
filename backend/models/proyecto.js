const pool = require('../config/db');

const Proyecto = {
    // Crear un nuevo proyecto
    async create({ nombre, descripcion, duracion, fecha_inicio, numero_integrantes, creador_id }) {
        const query = `
            INSERT INTO proyectos
            (nombre, descripcion, duracion, fecha_inicio, numero_integrantes, creador_id)
            VALUES ($1, $2, $3, $4, $5, $6)
            RETURNING id, nombre, descripcion, duracion, fecha_inicio, numero_integrantes, creador_id;
        `;
        const values = [nombre, descripcion, duracion, fecha_inicio, numero_integrantes, creador_id];

        try {
            const result = await pool.query(query, values);
            return result.rows[0];
        } catch (error) {
            console.error('Error en Proyecto.create:', error);
            throw error;
        }
    },

    // Obtener proyectos por creador
    async findByCreador(creador_id) {
        const query = `
            SELECT id, nombre, descripcion, duracion, fecha_inicio, numero_integrantes
            FROM proyectos
            WHERE creador_id = $1
            ORDER BY fecha_inicio DESC;
        `;
        const values = [creador_id];

        try {
            const result = await pool.query(query, values);
            return result.rows;
        } catch (error) {
            console.error('Error en Proyecto.findByCreador:', error);
            throw error;
        }
    },

    // Obtener todos los proyectos (para admin o búsqueda)
    async findAll() {
        const query = `
            SELECT p.id, p.nombre, p.descripcion, p.duracion, p.fecha_inicio, p.numero_integrantes, u.nombre_completo as creador
            FROM proyectos p
            JOIN usuarios u ON p.creador_id = u.id
            ORDER BY p.fecha_inicio DESC;
        `;

        try {
            const result = await pool.query(query);
            return result.rows;
        } catch (error) {
            console.error('Error en Proyecto.findAll:', error);
            throw error;
        }
    }
};

module.exports = Proyecto;