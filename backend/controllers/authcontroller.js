// backend/controllers/authController.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

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

// Login de usuario - definida como función con nombre
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
                programa: user.programa_academico
            }
        });

    } catch (error) {
        console.error('Error en login:', error);
        res.status(500).json({ error: 'Error interno del servidor' });
    }
};

// Exportar ambas funciones como objeto
module.exports = {
    register,
    login
};