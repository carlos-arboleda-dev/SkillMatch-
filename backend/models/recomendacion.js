const pool = require('../config/db');

const Recomendacion = {
    // Buscar usuarios con intereses similares
    async buscarPorIntereses(codigo_estudiantil, limite = 10) {
        const query = `
            SELECT 
                u.id,
                u.nombre_completo,
                u.correo_institucional,
                u.programa_academico,
                u.semestre,
                p.interes_academico,
                p.habilidades,
                p.tipo_proyecto,
                p.temas_gustan,
                p.rol_preferido,
                p.foto_perfil,
                -- Calcular afinidad basada en intereses
                (
                    COALESCE(cardinality(
                        (SELECT ARRAY(
                            SELECT unnest(p.interes_academico)
                            INTERSECT
                            SELECT unnest(p2.interes_academico)
                        ))
                    ), 0) * 3 +
                    COALESCE(cardinality(
                        (SELECT ARRAY(
                            SELECT unnest(p.habilidades)
                            INTERSECT
                            SELECT unnest(p2.habilidades)
                        ))
                    ), 0) * 2 +
                    COALESCE(cardinality(
                        (SELECT ARRAY(
                            SELECT unnest(p.temas_gustan)
                            INTERSECT
                            SELECT unnest(p2.temas_gustan)
                        ))
                    ), 0) * 2 +
                    COALESCE(cardinality(
                        (SELECT ARRAY(
                            SELECT unnest(p.tipo_proyecto)
                            INTERSECT
                            SELECT unnest(p2.tipo_proyecto)
                        ))
                    ), 0) * 1
                ) as afinidad
            FROM usuarios u
            JOIN perfil_academico p ON u.codigo_estudiantil = p.codigo_estudiantil
            CROSS JOIN (
                SELECT * FROM perfil_academico 
                WHERE codigo_estudiantil = $1
            ) p2
            WHERE u.codigo_estudiantil != $1
            ORDER BY afinidad DESC
            LIMIT $2;
        `;
        
        const result = await pool.query(query, [codigo_estudiantil, limite]);
        return result.rows;
    },

    // Buscar proyectos recomendados basados en intereses del usuario
    async proyectosRecomendados(codigo_estudiantil, limite = 5) {
        // Primero obtener intereses del usuario
        const perfilQuery = await pool.query(
            'SELECT interes_academico, tipo_proyecto FROM perfil_academico WHERE codigo_estudiantil = $1',
            [codigo_estudiantil]
        );
        
        if (perfilQuery.rows.length === 0) return [];
        
        const perfil = perfilQuery.rows[0];
        const intereses = perfil.interes_academico || [];
        const tiposProyecto = perfil.tipo_proyecto || [];
        
        // Buscar proyectos que coincidan con intereses
        const query = `
            SELECT 
                p.*,
                u.nombre_completo as autor_nombre,
                u.codigo_estudiantil as autor_codigo
            FROM proyectos p
            JOIN usuarios u ON p.autor_codigo = u.codigo_estudiantil
            WHERE 
                p.categoria = ANY($1::text[])
                OR p.categoria = ANY($2::text[])
            ORDER BY p.fecha_creacion DESC
            LIMIT $3;
        `;
        
        const result = await pool.query(query, [intereses, tiposProyecto, limite]);
        return result.rows;
    },

    // Buscar por palabra clave (búsqueda general)
    async buscarPorPalabra(clave, codigo_estudiantil, limite = 20) {
        const query = `
            SELECT 
                u.id,
                u.nombre_completo,
                u.correo_institucional,
                u.programa_academico,
                u.semestre,
                p.interes_academico,
                p.habilidades,
                p.foto_perfil,
                -- Relevancia basada en coincidencia de texto
                (
                    CASE WHEN u.nombre_completo ILIKE $1 THEN 10 ELSE 0 END +
                    CASE WHEN u.programa_academico ILIKE $1 THEN 5 ELSE 0 END +
                    COALESCE((
                        SELECT COUNT(*) FROM unnest(p.interes_academico) i 
                        WHERE i ILIKE $1
                    ), 0) * 3 +
                    COALESCE((
                        SELECT COUNT(*) FROM unnest(p.habilidades) h 
                        WHERE h ILIKE $1
                    ), 0) * 2
                ) as relevancia
            FROM usuarios u
            JOIN perfil_academico p ON u.codigo_estudiantil = p.codigo_estudiantil
            WHERE 
                u.codigo_estudiantil != $2
                AND (
                    u.nombre_completo ILIKE $1
                    OR u.programa_academico ILIKE $1
                    OR EXISTS (SELECT 1 FROM unnest(p.interes_academico) i WHERE i ILIKE $1)
                    OR EXISTS (SELECT 1 FROM unnest(p.habilidades) h WHERE h ILIKE $1)
                )
            ORDER BY relevancia DESC
            LIMIT $3;
        `;
        
        const patron = `%${clave}%`;
        const result = await pool.query(query, [patron, codigo_estudiantil, limite]);
        return result.rows;
    }
};

module.exports = Recomendacion;