// backend/middleware/auth.js
const jwt = require('jsonwebtoken');

// Verificar que el usuario está autenticado
const verificarToken = (req, res, next) => {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
        return res.status(401).json({ error: 'Acceso denegado. Token requerido.' });
    }

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
        req.user = verified;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Token inválido' });
    }
};

// Verificar que el usuario es administrador
const verificarAdmin = async (req, res, next) => {
    try {
        const pool = require('../config/db');
        const result = await pool.query(
            'SELECT rol FROM usuarios WHERE id = $1',
            [req.user.userId]
        );
        
        if (result.rows.length === 0 || result.rows[0].rol !== 'admin') {
            return res.status(403).json({ error: 'Acceso denegado. Se requieren permisos de administrador.' });
        }
        
        next();
    } catch (error) {
        console.error('Error verificando admin:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

module.exports = { verificarToken, verificarAdmin };