// backend/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const perfilRoutes = require('./routes/perfilroutes');
const adminRoutes = require('./routes/adminroutes');
const recomendacionRoutes = require('./routes/recomendacionroutes');


// Cargar variables de entorno
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors()); // Permite peticiones del frontend
app.use(express.json()); // Para parsear JSON
app.use(express.urlencoded({ extended: true })); // Para parsear formularios

// Ruta de prueba básica
app.get('/', (req, res) => {
    res.json({ message: '¡Bienvenido a la API de SkillMatch!' });
});

// Importar rutas de autenticación
const authRoutes = require('./routes/authroutes');

// Usar rutas
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/perfil', perfilRoutes);
app.use('/api/recomendaciones', recomendacionRoutes);




// Iniciar el servidor
app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});