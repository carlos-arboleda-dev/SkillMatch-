const pool = require('../config/db');

const Mensaje = {
    // Enviar mensaje
    async crear({ chat_id, usuario_id, mensaje }) {
        const query = `
            INSERT INTO mensajes (chat_id, usuario_id, mensaje)
            VALUES ($1, $2, $3)
            RETURNING id, chat_id, usuario_id, mensaje, created_at
        `;
        const result = await pool.query(query, [chat_id, usuario_id, mensaje]);
        return result.rows[0];
    },

    // Obtener mensajes de un chat
    async obtenerPorChat(chat_id, limite = 50) {
        const query = `
            SELECT m.*, u.nombre_completo as autor_nombre
            FROM mensajes m
            JOIN usuarios u ON m.usuario_id = u.id
            WHERE m.chat_id = $1
            ORDER BY m.created_at ASC
            LIMIT $2
        `;
        const result = await pool.query(query, [chat_id, limite]);
        return result.rows;
    },

    // Marcar mensajes como leídos
    async marcarLeidos(chat_id, usuario_id) {
        const query = `
            UPDATE mensajes 
            SET leido = TRUE 
            WHERE chat_id = $1 AND usuario_id != $2
        `;
        await pool.query(query, [chat_id, usuario_id]);
    }
};

module.exports = Mensaje;