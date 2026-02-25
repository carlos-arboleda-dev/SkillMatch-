// backend/routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authcontroller');
const { validateInstitutionalEmail, validateRegisterFields } = require('../middleware/validation');

// Ruta de registro con validaciones
router.post(
    '/register', 
    validateRegisterFields,      // Primero validamos campos requeridos
    validateInstitutionalEmail,  // Luego validamos correo institucional
    authController.register       // Finalmente ejecutamos el controlador
);

// Ruta de login (nueva)
router.post('/login', authController.login);

module.exports = router;