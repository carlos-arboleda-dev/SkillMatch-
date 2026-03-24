const Mensaje = require('../models/mensaje');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const mensajeController = {
    async enviarMensaje(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ error: 'Token requerido' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { chat_id, mensaje } = req.body;
            
            if (!chat_id || !mensaje) {
                return res.status(400).json({ error: 'Faltan datos requeridos' });
            }
            
            // Verificar acceso
            const acceso = await verificarAccesoChat(usuario_id, chat_id);
            if (!acceso) {
                return res.status(403).json({ error: 'No tienes acceso a este chat' });
            }
            
            // Crear chat si no existe
            const chat = await pool.query('SELECT * FROM chats WHERE id = $1', [chat_id]);
            if (chat.rows.length === 0) {
                const tipo = chat_id.startsWith('amigo-') ? 'amigo' : 'proyecto';
                await pool.query(
                    'INSERT INTO chats (id, tipo, nombre) VALUES ($1, $2, $3)',
                    [chat_id, tipo, chat_id]
                );
            }
            
            const nuevoMensaje = await Mensaje.crear({ chat_id, usuario_id, mensaje });
            
            const userQuery = await pool.query(
                'SELECT nombre_completo FROM usuarios WHERE id = $1',
                [usuario_id]
            );
            
            res.json({
                success: true,
                mensaje: {
                    ...nuevoMensaje,
                    autor_nombre: userQuery.rows[0].nombre_completo
                }
            });
            
        } catch (error) {
            console.error('Error enviando mensaje:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },
    
    async obtenerMensajes(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ error: 'Token requerido' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { chat_id } = req.params;
            const limite = req.query.limite || 50;
            
            const acceso = await verificarAccesoChat(usuario_id, chat_id);
            if (!acceso) {
                return res.status(403).json({ error: 'No tienes acceso a este chat' });
            }
            
            await Mensaje.marcarLeidos(chat_id, usuario_id);
            const mensajes = await Mensaje.obtenerPorChat(chat_id, limite);
            
            res.json({ success: true, mensajes });
            
        } catch (error) {
            console.error('Error obteniendo mensajes:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },
    
    async obtenerChats(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) return res.status(401).json({ error: 'Token requerido' });

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const chats = [];
            
            const amigos = await pool.query(`
                SELECT u.id, u.nombre_completo, u.codigo_estudiantil
                FROM amistades a
                JOIN usuarios u ON a.amigo_id = u.id
                WHERE a.usuario_id = $1 AND a.estado = 'aceptada'
            `, [usuario_id]);
            
            amigos.rows.forEach(amigo => {
                const ids = [parseInt(usuario_id), parseInt(amigo.id)].sort((a, b) => a - b);
                chats.push({
                    id: `amigo-${ids[0]}-${ids[1]}`,
                    tipo: 'amigo',
                    nombre: amigo.nombre_completo,
                    codigo: amigo.codigo_estudiantil,
                    usuarioId: amigo.id  // ← necesario para el frontend
                });
            });
            
            const proyectos = await pool.query(`
                SELECT DISTINCT p.id, p.nombre
                FROM proyectos p
                LEFT JOIN miembros_proyecto mp ON p.id = mp.proyecto_id
                WHERE p.creador_id = $1 OR mp.usuario_id = $1
            `, [usuario_id]);

            proyectos.rows.forEach(proyecto => {
                chats.push({
                    id: `proyecto-${proyecto.id}`,
                    tipo: 'proyecto',
                    nombre: proyecto.nombre,
                    proyectoId: proyecto.id
                });
            });
            
            res.json({ success: true, chats });
            
        } catch (error) {
            console.error('Error obteniendo chats:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
};

// FIX: verificar acceso con nuevo formato amigo-{idMenor}-{idMayor}
async function verificarAccesoChat(usuario_id, chat_id) {
    if (chat_id.startsWith('amigo-')) {
        // Formato: amigo-3-7 → extraer los dos IDs
        const partes = chat_id.split('-');
        
        if (partes.length === 3) {
            // Nuevo formato simétrico: amigo-{id1}-{id2}
            const id1 = parseInt(partes[1]);
            const id2 = parseInt(partes[2]);
            const uid = parseInt(usuario_id);
            
            // El usuario debe ser uno de los dos
            if (uid !== id1 && uid !== id2) return false;
            
            const otroId = uid === id1 ? id2 : id1;
            
            const check = await pool.query(
                `SELECT * FROM amistades 
                 WHERE usuario_id = $1 AND amigo_id = $2 AND estado = 'aceptada'`,
                [uid, otroId]
            );
            return check.rows.length > 0;
        } else {
            // Formato viejo: amigo-{id} — compatibilidad
            const amigoId = parseInt(partes[1]);
            const check = await pool.query(
                `SELECT * FROM amistades 
                 WHERE (usuario_id = $1 AND amigo_id = $2 AND estado = 'aceptada')
                    OR (usuario_id = $2 AND amigo_id = $1 AND estado = 'aceptada')`,
                [usuario_id, amigoId]
            );
            return check.rows.length > 0;
        }
    }
    else if (chat_id.startsWith('proyecto-')) {
        const proyectoId = parseInt(chat_id.split('-')[1]);
        
        const checkCreador = await pool.query(
            'SELECT id FROM proyectos WHERE id = $1 AND creador_id = $2',
            [proyectoId, usuario_id]
        );
        if (checkCreador.rows.length > 0) return true;
        
        const checkMiembro = await pool.query(
            'SELECT id FROM miembros_proyecto WHERE proyecto_id = $1 AND usuario_id = $2',
            [proyectoId, usuario_id]
        );
        return checkMiembro.rows.length > 0;
    }
    return false;
}


// Obtener o crear chat personal
async function obtenerOCrearChatPersonal(req, res) {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
        const usuario_id = decoded.userId;
        
        const { amigo_id } = req.params;
        
        // Verificar que son amigos
        const amistad = await pool.query(
            `SELECT * FROM amistades 
             WHERE (usuario_id = $1 AND amigo_id = $2 AND estado = 'aceptada')
                OR (usuario_id = $2 AND amigo_id = $1 AND estado = 'aceptada')`,
            [usuario_id, amigo_id]
        );
        
        if (amistad.rows.length === 0) {
            return res.status(403).json({ error: 'No son amigos' });
        }
        
        const chatId = `amigo-${amigo_id}`;
        
        // Crear chat si no existe
        await pool.query(
            'INSERT INTO chats (id, tipo, nombre) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
            [chatId, 'amigo', `Chat con ${amistad.rows[0].nombre || 'amigo'}`]
        );
        
        res.json({
            success: true,
            chat_id: chatId
        });
        
    } catch (error) {
        console.error('Error obteniendo chat personal:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
}

module.exports = mensajeController;