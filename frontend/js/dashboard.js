/* frontend/js/dashboard.js */

document.addEventListener('DOMContentLoaded', () => {
    // Disparar logro flotante de acceso directo tras un pequeño delay
    const achievementToast = document.getElementById('achievement-toast');
    if (achievementToast) {
        setTimeout(() => {
            achievementToast.classList.add('show');
            setTimeout(() => {
                achievementToast.classList.remove('show');
            }, 6000); // Ocultar después de 6 segundos
        }, 800);
    }

    // Referencias a elementos del DOM - Formulario y Controles
    const simForm = document.getElementById('sim-form');
    const btnSubmit = document.getElementById('btn-submit');
    const btnCsv = document.getElementById('btn-csv');
    
    const sliders = [
        { id: 'total_participantes', valId: 'val-participantes', suffix: '' },
        { id: 'tasa_error', valId: 'val-error', multiplier: 100, suffix: '%' },
        { id: 'tiempo_base_seg', valId: 'val-tiempo-base', suffix: 's' },
        { id: 'umbral_alertas', valId: 'val-umbral', suffix: '' },
        { id: 'ventana_registro_min', valId: 'val-ventana', suffix: 'm' },
        { id: 'numero_eventos', valId: 'val-eventos', suffix: '' }
    ];

    // Vincular sliders para mostrar valor en tiempo real
    sliders.forEach(slider => {
        const inputEl = document.getElementById(slider.id);
        const valEl = document.getElementById(slider.valId);
        
        if (inputEl && valEl) {
            inputEl.addEventListener('input', () => {
                let value = parseFloat(inputEl.value);
                if (slider.multiplier) {
                    value = Math.round(value * slider.multiplier);
                }
                valEl.textContent = `${value}${slider.suffix}`;
            });
        }
    });

    // Referencias a KPIs
    const kpiCards = {
        asistencia: document.getElementById('kpi-asistencia'),
        precision: document.getElementById('kpi-precision'),
        tiempo: document.getElementById('kpi-tiempo'),
        alertas: document.getElementById('kpi-alertas')
    };

    // Referencias de visualización
    const plotArea = document.getElementById('plot-area');
    const plotImg = document.getElementById('plot-img');
    const plotLoader = document.getElementById('plot-loader');
    const loaderText = document.getElementById('loader-text');
    const welcomeMessage = document.getElementById('welcome-message');
    const tabBtns = document.querySelectorAll('.tab-btn');

    // Referencias de datos
    const alertsContainer = document.getElementById('alerts-container');
    const tableBody = document.getElementById('table-body');

    let activeGraph = 'grafica1';
    let simulationResponse = null;

    // Manejar el cambio de pestañas de gráficos
    tabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const graphName = btn.getAttribute('data-graph');
            activeGraph = graphName;
            
            // Actualizar botones activos
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            cargarGrafico(graphName);
        });
    });

    // Función para cargar un gráfico con efecto de carga y cache-busting
    function cargarGrafico(graphName) {
        if (!simulationResponse) return;
        
        plotImg.classList.remove('loaded');
        plotLoader.style.display = 'flex';
        loaderText.textContent = `Cargando visualización de Matplotlib...`;
        
        // Cargar imagen con timestamp para evitar el caché del navegador
        const timestamp = Date.now();
        const src = `../assets/graphs/${graphName}.png?t=${timestamp}`;
        
        plotImg.src = src;
        
        plotImg.onload = () => {
            plotLoader.style.display = 'none';
            plotImg.classList.add('loaded');
        };
        
        plotImg.onerror = () => {
            plotLoader.style.display = 'none';
            plotArea.innerHTML = `
                <div class="welcome-overlay">
                    <i class="fa-solid fa-circle-exclamation" style="font-size: 40px; color: #ef4444;"></i>
                    <h3 class="welcome-title" style="margin-top: 15px;">Error al Cargar la Gráfica</h3>
                    <p class="welcome-desc">No se pudo encontrar la imagen generada en la ruta. Por favor vuelve a simular.</p>
                </div>
            `;
        };
    }

    // Procesar envío del formulario de simulación
    simForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        // Bloquear inputs y botón durante simulación
        btnSubmit.disabled = true;
        btnSubmit.innerHTML = `<i class="fa-solid fa-circle-notch fa-spin"></i> Simulando...`;
        
        // Ocultar mensajes/imágenes previas y mostrar loader
        welcomeMessage.style.display = 'none';
        plotImg.style.display = 'none';
        plotImg.classList.remove('loaded');
        plotLoader.style.display = 'flex';
        loaderText.textContent = 'Procesando simulación en Pandas...';
        
        // Obtener valores del formulario
        const payload = {
            total_participantes: parseInt(document.getElementById('total_participantes').value),
            tasa_error: parseFloat(document.getElementById('tasa_error').value),
            tiempo_base_seg: parseInt(document.getElementById('tiempo_base_seg').value),
            umbral_alertas: parseInt(document.getElementById('umbral_alertas').value),
            ventana_registro_min: parseInt(document.getElementById('ventana_registro_min').value),
            numero_eventos: parseInt(document.getElementById('numero_eventos').value)
        };

        try {
            console.log("Enviando petición de simulación:", payload);
            const response = await fetch('/api/simulate', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            
            if (result.success) {
                console.log("Simulación exitosa:", result.data);
                simulationResponse = result.data;
                
                // Habilitar pestañas de visualización
                tabBtns.forEach(btn => btn.removeAttribute('disabled'));
                
                // Actualizar los KPIs
                actualizarKPIs(simulationResponse);
                
                // Actualizar alertas
                actualizarAlertas(simulationResponse.alertas);
                
                // Actualizar tabla
                actualizarTabla(simulationResponse.preview);
                
                // Habilitar descarga CSV
                btnCsv.removeAttribute('disabled');
                
                // Mostrar imagen y cargar gráfico activo
                plotImg.style.display = 'block';
                cargarGrafico(activeGraph);
                
            } else {
                throw new Error(result.message || 'Error desconocido.');
            }
            
        } catch (error) {
            console.error("Error al procesar simulación:", error);
            plotLoader.style.display = 'none';
            plotArea.innerHTML = `
                <div class="welcome-overlay">
                    <i class="fa-solid fa-triangle-exclamation" style="font-size: 40px; color: #ef4444;"></i>
                    <h3 class="welcome-title" style="margin-top: 15px;">Fallo en la Simulación</h3>
                    <p class="welcome-desc">${error.message}. Asegúrate de tener Python, Pandas y Matplotlib correctamente instalados.</p>
                </div>
            `;
        } finally {
            // Desbloquear botón
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = `<i class="fa-solid fa-bolt"></i> Ejecutar Simulación`;
        }
    });

    // Función para renderizar los KPIs en la UI
    function actualizarKPIs(data) {
        const res = data.resumen;
        
        // 1. KPI Asistencia
        const pctAsistencia = res.asistencia_promedio_pct;
        kpiCards.asistencia.querySelector('.kpi-value').textContent = `${pctAsistencia}%`;
        const trendAsist = kpiCards.asistencia.querySelector('.kpi-trend');
        if (pctAsistencia >= 85) {
            trendAsist.className = "kpi-trend positive";
            trendAsist.innerHTML = `<i class="fa-solid fa-arrow-up-long"></i> Alta Asistencia`;
        } else if (pctAsistencia >= 60) {
            trendAsist.className = "kpi-trend neutral";
            trendAsist.innerHTML = `<i class="fa-solid fa-minus"></i> Asistencia Regular`;
        } else {
            trendAsist.className = "kpi-trend negative";
            trendAsist.innerHTML = `<i class="fa-solid fa-arrow-down-long"></i> Baja Asistencia`;
        }

        // 2. KPI Precisión
        const pctPrecision = res.precision_promedio_pct;
        kpiCards.precision.querySelector('.kpi-value').textContent = `${pctPrecision}%`;
        const trendPrec = kpiCards.precision.querySelector('.kpi-trend');
        if (pctPrecision >= 95) {
            trendPrec.className = "kpi-trend positive";
            trendPrec.innerHTML = `<i class="fa-solid fa-circle-check"></i> Registro Preciso`;
        } else if (pctPrecision >= 90) {
            trendPrec.className = "kpi-trend neutral";
            trendPrec.innerHTML = `<i class="fa-solid fa-shield-halved"></i> Tolerable`;
        } else {
            trendPrec.className = "kpi-trend negative";
            trendPrec.innerHTML = `<i class="fa-solid fa-triangle-exclamation"></i> Alta Tasa Errores`;
        }

        // 3. KPI Tiempo Total
        const tiempoMin = res.tiempo_total_procesamiento_min;
        kpiCards.tiempo.querySelector('.kpi-value').textContent = `${tiempoMin} min`;
        const trendTime = kpiCards.tiempo.querySelector('.kpi-trend');
        trendTime.className = "kpi-trend neutral";
        trendTime.innerHTML = `<i class="fa-solid fa-clock"></i> Tiempo Procesamiento`;

        // 4. KPI Alertas
        const numAlertas = data.alertas.length;
        kpiCards.alertas.querySelector('.kpi-value').textContent = numAlertas;
        const trendAlerts = kpiCards.alertas.querySelector('.kpi-trend');
        if (numAlertas === 0) {
            trendAlerts.className = "kpi-trend positive";
            trendAlerts.innerHTML = `<i class="fa-solid fa-check"></i> Sistema Saludable`;
        } else {
            trendAlerts.className = "kpi-trend negative";
            trendAlerts.innerHTML = `<i class="fa-solid fa-bell"></i> Requieren Atención`;
        }
    }

    // Renderizar lista de alertas de inasistencia consecutivas
    function actualizarAlertas(alertas) {
        alertsContainer.innerHTML = '';
        
        if (alertas.length === 0) {
            alertsContainer.innerHTML = `
                <div class="no-alerts">
                    <i class="fa-solid fa-circle-check no-alerts-icon"></i>
                    <span>No hay alertas activas. Todos los participantes cumplen el umbral de asistencia.</span>
                </div>
            `;
            return;
        }

        alertas.forEach(alerta => {
            const alertEl = document.createElement('div');
            alertEl.className = 'alert-item';
            alertEl.innerHTML = `
                <div class="alert-item-info">
                    <div class="alert-icon"><i class="fa-solid fa-circle-exclamation"></i></div>
                    <div class="alert-item-text">
                        <div class="alert-item-title">Participante #${alerta.id_participante}</div>
                        <div class="alert-item-desc">Inasistencias consecutivas registradas</div>
                    </div>
                </div>
                <div class="alert-badge">${alerta.inasistencias_consecutivas} Faltas</div>
            `;
            alertsContainer.appendChild(alertEl);
        });
    }

    // Renderizar la tabla de datos simulados
    function actualizarTabla(previewData) {
        tableBody.innerHTML = '';
        
        if (previewData.length === 0) {
            tableBody.innerHTML = `
                <tr>
                    <td colspan="6" style="text-align: center; color: var(--text-muted); padding: 40px 0;">
                        No se generaron registros.
                    </td>
                </tr>
            `;
            return;
        }

        previewData.forEach(row => {
            const tr = document.createElement('tr');
            
            // Badge para estado de asistencia
            let stateBadge = '';
            if (row.estado_asistencia === 'presente') {
                stateBadge = `<span class="badge badge-presente">Presente</span>`;
            } else if (row.estado_asistencia === 'tardanza') {
                stateBadge = `<span class="badge badge-tardanza">Tardanza</span>`;
            } else {
                stateBadge = `<span class="badge badge-ausente">Ausente</span>`;
            }

            // Formato para valores booleanos
            const errorText = row.hay_error 
                ? `<span style="color: #ef4444; font-weight: bold;"><i class="fa-solid fa-circle-xmark"></i> Si (+60s)</span>` 
                : `<span style="color: #10b981;"><i class="fa-solid fa-circle-check"></i> No</span>`;
                
            const duplicateText = row.registro_duplicado 
                ? `<span style="color: #fbbf24; font-weight: bold;"><i class="fa-solid fa-copy"></i> Duplicado</span>` 
                : `<span style="color: var(--text-muted);">Único</span>`;

            tr.innerHTML = `
                <td><strong>#${row.id_participante}</strong></td>
                <td>${row.evento_id}</td>
                <td>${stateBadge}</td>
                <td>${row.tiempo_registro_seg ? row.tiempo_registro_seg + 's' : '0.0s'}</td>
                <td>${errorText}</td>
                <td>${duplicateText}</td>
            `;
            tableBody.appendChild(tr);
        });
    }

    // Manejar descarga del dataset CSV completo
    btnCsv.addEventListener('click', () => {
        if (!simulationResponse) return;
        
        // Crear elemento temporal para disparar descarga
        const link = document.createElement('a');
        link.href = '../assets/dataset.csv';
        link.download = 'reporte_asistencia_simulada.csv';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    });
});
