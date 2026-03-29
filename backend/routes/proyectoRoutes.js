const express = require('express');
const router = express.Router();
const Proyecto = require('../models/proyecto');
const proyectoController = require('../controllers/proyectoController');
const { verificarToken } = require('../middleware/auth');


// Ruta para el feed (NUEVA)
router.get('/feed', verificarToken, proyectoController.obtenerFeed);

// Crear un nuevo proyecto
router.post('/crear', verificarToken, async (req, res) => {
    try {
        console.log('Datos recibidos:', req.body);
        console.log('Usuario:', req.user);
        const { nombre, descripcion, duracion, fechaInicio, integrantes } = req.body;
        const creador_id = req.user.userId;

        const proyecto = await Proyecto.create({
            nombre,
            descripcion,
            duracion,
            fecha_inicio: fechaInicio,
            numero_integrantes: parseInt(integrantes),
            creador_id
        });

        res.status(201).json({ message: 'Proyecto creado exitosamente', proyecto });
    } catch (error) {
        console.error('Error creando proyecto:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener proyectos del usuario autenticado
router.get('/mis-proyectos', verificarToken, async (req, res) => {
    try {
        const creador_id = req.user.userId;
        const proyectos = await Proyecto.findByCreador(creador_id);
        res.json(proyectos);
    } catch (error) {
        console.error('Error obteniendo proyectos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

// Obtener todos los proyectos
router.get('/', verificarToken, async (req, res) => {
    try {
        const proyectos = await Proyecto.findAll();
        res.json(proyectos);
    } catch (error) {
        console.error('Error obteniendo proyectos:', error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
});

router.post('/:proyecto_id/unirse', verificarToken, proyectoController.unirseAProyecto);

module.exports = router;