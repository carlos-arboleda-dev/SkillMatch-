const express = require('express');
const router = express.Router();
const recomendacionController = require('../controllers/recomendacioncontroller');

router.get('/usuarios', recomendacionController.recomendarUsuarios);
router.get('/buscar', recomendacionController.buscarUsuarios);
router.get('/proyectos', recomendacionController.recomendarProyectos);
router.get('/proyectos-por-intereses', recomendacionController.recomendarProyectosPorIntereses);


module.exports = router;