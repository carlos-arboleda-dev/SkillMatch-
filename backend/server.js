// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares - IMPORTANTE: deben estar antes de las rutas
app.use(cors()); // Permite peticiones del frontend
app.use(express.json({ limit: '10mb' })); // Para parsear JSON
app.use(express.urlencoded({ extended: true, limit: '10mb' })); // Para parsear formularios

// Ruta de prueba básica
app.get('/', (req, res) => {
    res.json({ message: '¡Bienvenido a la API de SkillMatch!' });
});

// Importar rutas
const authRoutes = require('./routes/authroutes');
const perfilRoutes = require('./routes/perfilroutes');
const adminRoutes = require('./routes/adminroutes');
const recomendacionRoutes = require('./routes/recomendacionroutes');
const proyectoRoutes = require('./routes/proyectoRoutes');
const comentarioRoutes = require('./routes/comentarioRoutes');
const likeRoutes = require('./routes/likeRoutes');
const notificacionRoutes = require('./routes/notificacionRoutes');
const amistadRoutes = require('./routes/amistadRoutes');
const invitacionRoutes = require('./routes/invitacionRoutes');
const usuarioRoutes = require('./routes/usuarioRoutes');
const mensajeRoutes = require('./routes/mensajeRoutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/recomendaciones', recomendacionRoutes);
app.use('/api/proyectos', proyectoRoutes);
app.use('/api/comentarios', comentarioRoutes);
app.use('/api/likes', likeRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/amistades', amistadRoutes);
app.use('/api/invitaciones', invitacionRoutes);
app.use('/api/usuarios', usuarioRoutes);
app.use('/api/mensajes', mensajeRoutes);

// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});