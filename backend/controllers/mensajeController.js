const Mensaje = require('../models/mensaje');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');

const mensajeController = {
    // Enviar mensaje
    async enviarMensaje(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { chat_id, mensaje } = req.body;
            
            if (!chat_id || !mensaje) {
                return res.status(400).json({ error: 'Faltan datos requeridos' });
            }
            
            // Verificar que el usuario tiene acceso al chat
            const chat = await pool.query(
                'SELECT * FROM chats WHERE id = $1',
                [chat_id]
            );
            
            if (chat.rows.length === 0) {
                // Crear el chat si no existe (para mantener compatibilidad)
                const tipo = chat_id.startsWith('amigo-') ? 'amigo' : 'proyecto';
                await pool.query(
                    'INSERT INTO chats (id, tipo, nombre) VALUES ($1, $2, $3)',
                    [chat_id, tipo, chat_id]
                );
            }
            
            // Guardar mensaje
            const nuevoMensaje = await Mensaje.crear({
                chat_id,
                usuario_id,
                mensaje
            });
            
            // Obtener nombre del usuario
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
    
    // Obtener mensajes de un chat
    async obtenerMensajes(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            const { chat_id } = req.params;
            const limite = req.query.limite || 50;
            
            // Verificar acceso al chat
            const acceso = await verificarAccesoChat(usuario_id, chat_id);
            if (!acceso) {
                return res.status(403).json({ error: 'No tienes acceso a este chat' });
            }
            
            // Marcar mensajes como leídos
            await Mensaje.marcarLeidos(chat_id, usuario_id);
            
            // Obtener mensajes
            const mensajes = await Mensaje.obtenerPorChat(chat_id, limite);
            
            res.json({
                success: true,
                mensajes
            });
            
        } catch (error) {
            console.error('Error obteniendo mensajes:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    },
    
    // Obtener lista de chats del usuario
    async obtenerChats(req, res) {
        try {
            const token = req.header('Authorization')?.replace('Bearer ', '');
            if (!token) {
                return res.status(401).json({ error: 'Token requerido' });
            }

            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
            const usuario_id = decoded.userId;
            
            console.log('🔍 Obteniendo chats para usuario:', usuario_id);
            
            const chats = [];
            
            // 1. Obtener amigos (conversaciones individuales)
            const amigos = await pool.query(`
                SELECT u.id, u.nombre_completo, u.codigo_estudiantil
                FROM amistades a
                JOIN usuarios u ON a.amigo_id = u.id
                WHERE a.usuario_id = $1 AND a.estado = 'aceptada'
            `, [usuario_id]);
            
            console.log('Amigos encontrados:', amigos.rows);
            
            amigos.rows.forEach(amigo => {
                chats.push({
                    id: `amigo-${amigo.id}`,
                    tipo: 'amigo',
                    nombre: amigo.nombre_completo,
                    codigo: amigo.codigo_estudiantil,
                    usuarioId: amigo.id
                });
            });
            
            // 2. Obtener proyectos
            const proyectos = await pool.query(`
                SELECT DISTINCT p.id, p.nombre
                FROM proyectos p
                LEFT JOIN miembros_proyecto mp ON p.id = mp.proyecto_id
                WHERE p.creador_id = $1 OR mp.usuario_id = $1
            `, [usuario_id]);
            
            console.log('Proyectos encontrados:', proyectos.rows);
            
            proyectos.rows.forEach(proyecto => {
                chats.push({
                    id: `proyecto-${proyecto.id}`,
                    tipo: 'proyecto',
                    nombre: proyecto.nombre,
                    proyectoId: proyecto.id
                });
            });
            
            console.log('Total chats:', chats.length);
            
            res.json({
                success: true,
                chats
            });
            
        } catch (error) {
            console.error('Error obteniendo chats:', error);
            res.status(500).json({ error: 'Error del servidor' });
        }
    }
};

// Función auxiliar para verificar acceso al chat
async function verificarAccesoChat(usuario_id, chat_id) {
    if (chat_id.startsWith('amigo-')) {
        const amigoId = parseInt(chat_id.split('-')[1]);
        const check = await pool.query(
            `SELECT * FROM amistades 
             WHERE (usuario_id = $1 AND amigo_id = $2 AND estado = 'aceptada')
                OR (usuario_id = $2 AND amigo_id = $1 AND estado = 'aceptada')`,
            [usuario_id, amigoId]
        );
        return check.rows.length > 0;
    } 
    else if (chat_id.startsWith('proyecto-')) {
        const proyectoId = parseInt(chat_id.split('-')[1]);
        
        // Verificar si es creador o miembro
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
};

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