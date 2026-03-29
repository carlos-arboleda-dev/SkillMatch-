// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const pool = require('../config/db');

// Registro de usuario - definida como función con nombre
const register = async (req, res) => {
    try {
        const { nombre, apellido, email, codigo, programa, semestre, password } = req.body;

        // Verificar si el correo ya está registrado
        const existingEmail = await User.findByEmail(email);
        if (existingEmail) {
            return res.status(400).json({ 
                error: 'El correo electrónico ya está registrado' 
            });
        }

        // Verificar si el código estudiantil ya está registrado
        const existingCodigo = await User.findByCodigo(codigo);
        if (existingCodigo) {
            return res.status(400).json({ 
                error: 'El código estudiantil ya está registrado' 
            });
        }

        // Encriptar contraseña
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Crear nombre completo
        const nombre_completo = `${nombre} ${apellido}`.trim();

        // Crear usuario en la base de datos
        const newUser = await User.create({
            nombre_completo,
            correo: email,
            codigo,
            programa,
            semestre: parseInt(semestre),
            password_hash
        });

        // Responder éxito
        res.status(201).json({
            success: true,
            message: 'Usuario registrado exitosamente',
            user: {
                id: newUser.id,
                nombre: newUser.nombre_completo,
                email: newUser.correo_institucional
            }
        });

    } catch (error) {
        console.error('Error en registro:', error);
        res.status(500).json({ 
            error: 'Error interno del servidor. Por favor intenta más tarde.' 
        });
    }
};

// Login de usuario
const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Validar que llegaron los campos
        if (!email || !password) {
            return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
        }

        // Buscar usuario por email o código
        const user = await User.findByEmailOrCodigo(email);
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // Verificar contraseña
        const passwordValida = await bcrypt.compare(password, user.contrasena_hash);
        if (!passwordValida) {
            return res.status(401).json({ error: 'Credenciales inválidas' });
        }

        // 👇 ACTUALIZAR ÚLTIMO LOGIN
        await pool.query(
            'UPDATE usuarios SET ultimo_login = NOW() WHERE id = $1',
            [user.id]
        );

        // Generar token JWT
        const token = jwt.sign(
            { 
                userId: user.id, 
                email: user.correo_institucional,
                nombre: user.nombre_completo 
            },
            process.env.JWT_SECRET || 'SkillMatch2025SecretKey!',
            { expiresIn: '24h' }
        );

        // Responder con éxito
        res.json({
            success: true,
            message: 'Login exitoso',
            token,
            user: {
                id: user.id,
                nombre: user.nombre_completo,
                email: user.correo_institucional,
                programa: user.programa_academico,
                rol: user.rol
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Registro de administrador
const registerAdmin = async (req, res) => {
    try {
        const { nombre, email, codigo, password, rol } = req.body;

        // Validar que sea admin
        if (rol !== 'admin') {
            return res.status(400).json({ error: 'Rol no válido para este registro' });
        }

        // Verificar si el correo ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        // Encriptar contraseña
        const password_hash = await bcrypt.hash(password, 10);

        // Crear usuario admin con valores por defecto para campos de estudiante
        const newUser = await User.createAdmin({
            nombre_completo: nombre,
            correo: email,
            codigo: codigo || `ADMIN-${Date.now()}`,
            programa: 'Administración',
            semestre: 1,
            password_hash,
            rol: 'admin'
        });

        res.status(201).json({
            success: true,
            message: 'Administrador registrado exitosamente',
            user: {
                id: newUser.id,
                nombre: newUser.nombre_completo,
                email: newUser.correo_institucional,
                rol: 'admin'
            }
        });

    } catch (error) {
        console.error('Error registrando admin:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Logout - registrar última desconexión
const logout = async (req, res) => {
    try {
        const token = req.header('Authorization')?.replace('Bearer ', '');
        if (!token) {
            return res.status(401).json({ error: 'Token requerido' });
        }

        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'SkillMatch2025SecretKey!');
        
        await pool.query(
            'UPDATE usuarios SET ultimo_logout = NOW() WHERE id = $1',
            [decoded.userId]
        );
        
        res.json({ success: true, message: 'Sesión cerrada correctamente' });
    } catch (error) {
        console.error('Error en logout:', error);
        res.status(500).json({ error: 'Error del servidor' });
    }
};

// Exportar ambas funciones como objeto
module.exports = {
    register,
    login,
    registerAdmin,
    logout
};