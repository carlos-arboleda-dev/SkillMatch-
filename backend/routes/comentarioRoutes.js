const express = require('express');
const router = express.Router();
const comentarioController = require('../controllers/comentarioController');

router.post('/', comentarioController.crearComentario);
router.get('/proyecto/:proyectoId', comentarioController.obtenerComentarios);
router.put('/:id', comentarioController.editarComentario);
router.delete('/:id', comentarioController.eliminarComentario);

module.exports = router;