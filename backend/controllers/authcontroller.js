const bcrypt = require('bcrypt');
const User = require('../models/user');

exports.register = async (req, res) => {
    try {
        const { nombre, apellido, email, codigo, programa, semestre, password } = req.body;

        // Validar dominio del correo
        const dominio = '@udenar.edu.co'; // o usar variable de entorno
        if (!email.endsWith(dominio)) {
            return res.status(400).json({ error: 'Debes usar tu correo institucional' });
        }

        // Verificar si el correo ya existe
        const existingUser = await User.findByEmail(email);
        if (existingUser) {
            return res.status(400).json({ error: 'El correo ya está registrado' });
        }

        // Encriptar contraseña
        const saltRounds = 10;
        const password_hash = await bcrypt.hash(password, saltRounds);

        // Crear usuario (unimos nombre y apellido)
        const nombre_completo = `${nombre} ${apellido}`;
        const newUser = await User.create({
            nombre_completo,
            correo: email,
            codigo,
            programa,
            semestre,
            password_hash
        });

        res.status(201).json({ 
            message: 'Usuario registrado exitosamente',
            userId: newUser.id 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Error en el servidor' });
    }
};