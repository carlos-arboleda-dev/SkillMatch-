const pool = require('../config/db');

const Like = {
    // Dar like a un proyecto
    async toggle(usuario_id, proyecto_id) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Verificar si ya existe el like
            const checkQuery = 'SELECT id FROM likes_proyecto WHERE usuario_id = $1 AND proyecto_id = $2';
            const checkResult = await client.query(checkQuery, [usuario_id, proyecto_id]);
            
            let liked = false;
            
            if (checkResult.rows.length > 0) {
                // Ya existe, entonces quitamos el like
                await client.query(
                    'DELETE FROM likes_proyecto WHERE usuario_id = $1 AND proyecto_id = $2',
                    [usuario_id, proyecto_id]
                );
                await client.query(
                    'UPDATE proyectos SET likes_count = GREATEST(likes_count - 1, 0) WHERE id = $1',
                    [proyecto_id]
                );
                liked = false;
            } else {
                // No existe, agregamos like
                await client.query(
                    'INSERT INTO likes_proyecto (usuario_id, proyecto_id) VALUES ($1, $2)',
                    [usuario_id, proyecto_id]
                );
                await client.query(
                    'UPDATE proyectos SET likes_count = likes_count + 1 WHERE id = $1',
                    [proyecto_id]
                );
                liked = true;
            }
            
            // Obtener el nuevo contador
            const countResult = await client.query(
                'SELECT likes_count FROM proyectos WHERE id = $1',
                [proyecto_id]
            );
            
            await client.query('COMMIT');
            
            return {
                liked,
                likes_count: countResult.rows[0].likes_count
            };
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error en Like.toggle:', error);
            throw error;
        } finally {
            client.release();
        }
    },

    // Verificar si un usuario ya dio like a un proyecto
    async check(usuario_id, proyecto_id) {
        const query = 'SELECT id FROM likes_proyecto WHERE usuario_id = $1 AND proyecto_id = $2';
        const result = await pool.query(query, [usuario_id, proyecto_id]);
        return result.rows.length > 0;
    }
};

module.exports = Like;