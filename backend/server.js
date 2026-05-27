// backend/server.js
const express = require('express');
const cors = require('cors');
const path = require('path');
const { exec } = require('child_process');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger para depuración
app.use((req, res, next) => {
    console.log(`📥 [API] ${req.method} ${req.url}`);
    next();
});

// Endpoint principal para ejecutar la simulación de asistencia
app.post('/api/simulate', (req, res) => {
    // Extraer y validar parámetros (usar valores por defecto seguros)
    const total_participantes = parseInt(req.body.total_participantes) || 30;
    const tasa_error = parseFloat(req.body.tasa_error) !== undefined ? parseFloat(req.body.tasa_error) : 0.05;
    const tiempo_base_seg = parseInt(req.body.tiempo_base_seg) || 30;
    const umbral_alertas = parseInt(req.body.umbral_alertas) || 3;
    const ventana_registro_min = parseInt(req.body.ventana_registro_min) || 15;
    const numero_eventos = parseInt(req.body.numero_eventos) || 10;

    // Rutas absolutas para evitar problemas de directorios
    const pythonScriptPath = path.join(__dirname, '../proyecto_asistencia/main.py');
    const outputAssetsDir = path.join(__dirname, '../frontend/assets');
    const summaryJsonPath = path.join(outputAssetsDir, 'summary.json');

    // Construir comando de ejecución seguro de Python
    // Al ser parseados numéricamente arriba, evitamos cualquier riesgo de inyección de comandos
    const command = `python "${pythonScriptPath}" ` +
        `--total_participantes ${total_participantes} ` +
        `--tasa_error ${tasa_error} ` +
        `--tiempo_base_seg ${tiempo_base_seg} ` +
        `--umbral_alertas ${umbral_alertas} ` +
        `--ventana_registro_min ${ventana_registro_min} ` +
        `--numero_eventos ${numero_eventos} ` +
        `--output_dir "${outputAssetsDir}"`;

    console.log(`🌀 Ejecutando simulación en Python...`);
    console.log(`💻 Comando: ${command}`);

    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`❌ Error al ejecutar Python: ${error.message}`);
            console.error(`stderr: ${stderr}`);
            return res.status(500).json({
                success: false,
                message: 'Error interno en la suite de simulación de Python.',
                error: error.message,
                stderr: stderr
            });
        }

        console.log(`stdout: ${stdout}`);
        
        // Leer el archivo summary.json generado por la simulación
        fs.readFile(summaryJsonPath, 'utf8', (err, data) => {
            if (err) {
                console.error(`❌ Error al leer summary.json: ${err.message}`);
                return res.status(500).json({
                    success: false,
                    message: 'La simulación finalizó, pero no se pudo leer el archivo de resultados.',
                    error: err.message
                });
            }

            try {
                const summaryObj = JSON.parse(data);
                res.json({
                    success: true,
                    message: 'Simulación completada con éxito.',
                    data: summaryObj
                });
            } catch (parseErr) {
                console.error(`❌ Error al parsear JSON: ${parseErr.message}`);
                res.status(500).json({
                    success: false,
                    message: 'El archivo de resultados generado no es un JSON válido.',
                    error: parseErr.message
                });
            }
        });
    });
});

// Servir archivos estáticos del frontend
app.use(express.static(path.join(__dirname, '../frontend')));
app.use('/assets', express.static(path.join(__dirname, '../frontend/assets')));

// Redirigir raíz a la nueva página central del Dashboard
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Redirigir index.html
app.get('/index.html', (req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

// Iniciar servidor NodeJS
app.listen(PORT, () => {
    console.log(`✅ Servidor NodeJS corriendo en http://localhost:${PORT}`);
    console.log(`📊 Dashboard de Asistencia disponible en http://localhost:${PORT}`);
});