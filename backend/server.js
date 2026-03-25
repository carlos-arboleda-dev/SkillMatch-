// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;



// Middlewares
app.use(express.static(path.join(__dirname, '../frontend')));
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logger para depuración
app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
});

// ========== PRIMERO LAS RUTAS DE LA API ==========
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

// Ruta de prueba de API
app.get('/api', (req, res) => {
    res.json({ message: '¡Bienvenido a la API de SkillMatch!' });
});

// ========== DESPUÉS SERVIR ARCHIVOS ESTÁTICOS ==========
// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend/pages')));
app.use('/css', express.static(path.join(__dirname, '../frontend/css')));
app.use('/js', express.static(path.join(__dirname, '../frontend/js')));

// Redirigir raíz a feed.html
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/feed.html'));
});

// Para cualquier otra ruta HTML
app.get('/:page.html', (req, res) => {
    const page = req.params.page;
    const filePath = path.join(__dirname, '../frontend/pages', `${page}.html`);
    res.sendFile(filePath);
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`✅ Servidor corriendo en http://localhost:${PORT}`);
    console.log(`📱 Acceso externo: ${process.env.TUNNEL_URL || 'usar cloudflared'}`);
});