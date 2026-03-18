const pool = require('../config/db');

const Comentario = {
    // Crear un nuevo comentario
    async create({ contenido, usuario_id, proyecto_id }) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Insertar comentario
            const comentarioQuery = `
                INSERT INTO comentarios (contenido, usuario_id, proyecto_id)
                VALUES ($1, $2, $3)
                RETURNING id, contenido, usuario_id, proyecto_id, created_at;
            `;
            const comentarioValues = [contenido, usuario_id, proyecto_id];
            const comentarioResult = await client.query(comentarioQuery, comentarioValues);
            
            // Actualizar contador de comentarios en proyectos
            await client.query(
                'UPDATE proyectos SET comentarios_count = comentarios_count + 1 WHERE id = $1',
                [proyecto_id]
            );
            
            await client.query('COMMIT');
            return comentarioResult.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error en Comentario.create:', error);
            throw error;
        } finally {
            client.release();
        }
    },

    // Obtener comentarios de un proyecto
    async findByProyecto(proyecto_id) {
        const query = `
            SELECT c.*, u.nombre_completo as autor_nombre, u.codigo_estudiantil,
                   p.foto_perfil
            FROM comentarios c
            JOIN usuarios u ON c.usuario_id = u.id
            LEFT JOIN perfil_academico p ON u.codigo_estudiantil = p.codigo_estudiantil
            WHERE c.proyecto_id = $1
            ORDER BY c.created_at DESC;
        `;
        const result = await pool.query(query, [proyecto_id]);
        return result.rows;
    },

    // Eliminar comentario (solo el autor o admin)
    async delete(id, usuario_id) {
        const client = await pool.connect();
        
        try {
            await client.query('BEGIN');
            
            // Obtener proyecto_id antes de eliminar
            const getProyecto = await client.query(
                'SELECT proyecto_id FROM comentarios WHERE id = $1 AND usuario_id = $2',
                [id, usuario_id]
            );
            
            if (getProyecto.rows.length === 0) {
                await client.query('ROLLBACK');
                return null;
            }
            
            const proyecto_id = getProyecto.rows[0].proyecto_id;
            
            // Eliminar comentario
            const deleteQuery = 'DELETE FROM comentarios WHERE id = $1 AND usuario_id = $2 RETURNING id';
            const result = await client.query(deleteQuery, [id, usuario_id]);
            
            if (result.rows.length > 0) {
                // Actualizar contador de comentarios
                await client.query(
                    'UPDATE proyectos SET comentarios_count = GREATEST(comentarios_count - 1, 0) WHERE id = $1',
                    [proyecto_id]
                );
            }
            
            await client.query('COMMIT');
            return result.rows[0];
            
        } catch (error) {
            await client.query('ROLLBACK');
            console.error('Error en Comentario.delete:', error);
            throw error;
        } finally {
            client.release();
        }
    }
};

module.exports = Comentario;