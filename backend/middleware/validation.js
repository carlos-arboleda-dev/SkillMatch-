// backend/middleware/validation.js

// Validar que el correo sea institucional
const validateInstitutionalEmail = (req, res, next) => {
    const { email } = req.body;
    const dominio = process.env.INSTITUTIONAL_EMAIL_DOMAIN || '@udenar.edu.co';
    
    if (!email || typeof email !== 'string' || !email.endsWith(dominio)) {
        return res.status(400).json({ 
            error: `Debes usar tu correo institucional (${dominio})` 
        });
    }
    
    next();
};

// Validar campos requeridos para registro
const validateRegisterFields = (req, res, next) => {
    const { nombre, apellido, email, codigo, programa, semestre, password } = req.body;
    
    // Verificar que req.body existe
    if (!req.body) {
        return res.status(400).json({ error: 'No se recibieron datos' });
    }

    // Lista de campos requeridos con validación mejorada
    const requiredFields = [
        { value: nombre, name: 'nombre', type: 'string' },
        { value: apellido, name: 'apellido', type: 'string' },
        { value: email, name: 'email', type: 'string' },
        { value: codigo, name: 'código estudiantil', type: 'string' },
        { value: programa, name: 'programa académico', type: 'string' },
        { value: semestre, name: 'semestre', type: 'number' },
        { value: password, name: 'contraseña', type: 'string' }
    ];
    
    for (const field of requiredFields) {
        // Verificar si el campo existe
        if (field.value === undefined || field.value === null) {
            return res.status(400).json({ 
                error: `El campo ${field.name} es obligatorio` 
            });
        }

        // Para campos de tipo string, verificar que no estén vacíos
        if (field.type === 'string') {
            if (typeof field.value !== 'string' || field.value.trim() === '') {
                return res.status(400).json({ 
                    error: `El campo ${field.name} debe ser un texto válido y no estar vacío` 
                });
            }
        }

        // Para el semestre (número), verificar que sea válido
        if (field.name === 'semestre') {
            const semestreNum = parseInt(field.value);
            if (isNaN(semestreNum) || semestreNum < 1 || semestreNum > 12) {
                return res.status(400).json({ 
                    error: 'El semestre debe ser un número entre 1 y 12' 
                });
            }
        }
    }
    
    // Validar longitud mínima de contraseña (ya sabemos que es string por la validación anterior)
    if (password.length < 6) {
        return res.status(400).json({ 
            error: 'La contraseña debe tener al menos 6 caracteres' 
        });
    }
    
    // Si todo está bien, continuamos
    next();
};

module.exports = {
    validateInstitutionalEmail,
    validateRegisterFields
};