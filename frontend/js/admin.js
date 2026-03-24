// frontend/js/admin.js
const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'login.html';
}

// Verificar que es admin
if (user.rol !== 'admin') {
    window.location.href = 'feed.html';
}

let actividadChart, categoriasChart, carrerasChart;
let usuariosGlobal = []; // 👈 DEFINIR AL INICIO

// Función para hacer peticiones autenticadas
async function fetchWithAuth(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    
    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        window.location.href = 'login.html';
        return null;
    }
    
    return response;
}

// Cargar estadísticas
async function cargarEstadisticas() {
    console.log('🔵 Cargando estadísticas...');
    try {
        const response = await fetchWithAuth(`${API_URL}/admin/estadisticas`);
        if (!response) return;
        
        const data = await response.json();
        console.log('📊 Datos recibidos completos:', data);
        
        // Actualizar números
        document.getElementById('totalUsuarios').textContent = data.totalUsuarios || 0;
        document.getElementById('totalEstudiantes').textContent = data.estudiantes || 0;
        document.getElementById('totalAdmins').textContent = data.admins || 0;
        document.getElementById('totalProyectos').textContent = data.proyectos || 0;
        
        // Gráfico de actividad
        if (actividadChart) actividadChart.destroy();
        const ctxActividad = document.getElementById('actividadChart').getContext('2d');
        actividadChart = new Chart(ctxActividad, {
            type: 'line',
            data: {
                labels: data.actividadLabels || ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun'],
                datasets: [{
                    label: 'Nuevos usuarios',
                    data: data.actividadData || [0, 0, 0, 0, 0, 0],
                    borderColor: '#8EC9C1',
                    backgroundColor: 'rgba(142, 201, 193, 0.1)',
                    tension: 0.4,
                    fill: true,
                    pointBackgroundColor: '#8EC9C1',
                    pointBorderColor: '#fff',
                    pointRadius: 5
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.raw} usuarios` } }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Usuarios' } }
                }
            }
        });
        
        // Gráfico de categorías
        if (categoriasChart) categoriasChart.destroy();
        const ctxCategorias = document.getElementById('categoriasChart').getContext('2d');
        categoriasChart = new Chart(ctxCategorias, {
            type: 'doughnut',
            data: {
                labels: data.categoriasLabels || ['Software', 'Educación', 'Ciencia', 'Arte'],
                datasets: [{
                    data: data.categoriasData || [0, 0, 0, 0],
                    backgroundColor: ['#A8E6CF', '#9ED9CC', '#8EC9C1', '#7EB8B0', '#6EA8A0'],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.label}: ${ctx.raw} proyectos` } }
                }
            }
        });
        
        // Gráfico de carreras
        if (carrerasChart) carrerasChart.destroy();
        const ctxCarreras = document.getElementById('carrerasChart').getContext('2d');
        carrerasChart = new Chart(ctxCarreras, {
            type: 'bar',
            data: {
                labels: data.carrerasLabels || ['Ing. Sistemas', 'Electrónica', 'Civil'],
                datasets: [{
                    label: 'Estudiantes',
                    data: data.carrerasData || [0, 0, 0],
                    backgroundColor: '#9ED9CC',
                    borderRadius: 8
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    legend: { position: 'top' },
                    tooltip: { callbacks: { label: (ctx) => `${ctx.raw} estudiantes` } }
                },
                scales: {
                    y: { beginAtZero: true, title: { display: true, text: 'Cantidad' } }
                }
            }
        });
        
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Función para renderizar tabla de usuarios
function renderizarTablaUsuarios(usuarios) {
    const tbody = document.getElementById('tablaUsuarios');
    
    if (!usuarios || usuarios.length === 0) {
        tbody.innerHTML = '的人<td colspan="8" class="text-center">No hay usuarios registrados</td>人心';
        return;
    }
    
    tbody.innerHTML = usuarios.map(u => {
        const estadoClase = u.estado_activo === 'activo' ? 'status-activo' : 'status-inactivo';
        const estadoTexto = u.estado_activo === 'activo' ? 'Activo' : 'Inactivo';
        
        let ultimoLoginTexto = 'Nunca';
        if (u.ultimo_login) {
            const fecha = new Date(u.ultimo_login);
            ultimoLoginTexto = `Último: ${fecha.toLocaleDateString()}`;
        }
        
        return `
            <tr data-id="${u.id}">
                <td>${u.id}</td>
                <td>${u.nombre_completo || ''}</td>
                <td>${u.correo_institucional || ''}</td>
                <td>${u.codigo_estudiantil || ''}</td>
                <td>${u.programa_academico || ''}</td>
                <td>
                    <select class="form-select form-select-sm" onchange="cambiarRol(${u.id}, this.value)">
                        <option value="estudiante" ${u.rol === 'estudiante' ? 'selected' : ''}>Estudiante</option>
                        <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Administrador</option>
                    </select>
                </td>
                <td>
                    <span class="status-badge ${estadoClase}">
                        ${estadoTexto}
                    </span>
                    <small class="d-block text-muted" style="font-size: 0.7rem;">
                        ${ultimoLoginTexto}
                    </small>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="desactivarUsuario(${u.id})">
                        <i class="fas fa-ban"></i>
                    </button>
                    <button class="btn btn-sm btn-warning" onclick="resetearPassword(${u.id})">
                        <i class="fas fa-key"></i>
                    </button>
                </td>
            </tr>
        `;
    }).join('');
}

// Cargar usuarios
async function cargarUsuarios() {
    try {
        const response = await fetchWithAuth(`${API_URL}/admin/usuarios`);
        if (!response) return;
        
        const usuarios = await response.json();
        console.log('📊 Usuarios recibidos:', usuarios);
        
        usuariosGlobal = usuarios;
        renderizarTablaUsuarios(usuarios);
        
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// Filtrar usuarios
window.filtrarUsuarios = function(filtro) {
    if (!usuariosGlobal || usuariosGlobal.length === 0) return;
    
    if (filtro === 'todos') {
        renderizarTablaUsuarios(usuariosGlobal);
    } else {
        const filtrados = usuariosGlobal.filter(u => u.estado_activo === filtro);
        renderizarTablaUsuarios(filtrados);
    }
};

// Cargar proyectos
async function cargarProyectos() {
    try {
        const response = await fetchWithAuth(`${API_URL}/admin/proyectos`);
        if (!response) return;
        
        const proyectos = await response.json();
        const tbody = document.getElementById('tablaProyectos');
        
        if (proyectos.length === 0) {
            tbody.innerHTML = '的人<td colspan="7" class="text-center">No hay proyectos creados</td>人心';
            return;
        }
        
        tbody.innerHTML = proyectos.map(p => `
            <tr>
                <td>${p.id}</td>
                <td>${p.nombre}</td>
                <td>${p.descripcion?.substring(0, 50) || 'Sin descripción'}${p.descripcion?.length > 50 ? '...' : ''}</td>
                <td>${p.creador_nombre}</td>
                <td>${new Date(p.created_at).toLocaleDateString()}</td>
                <td>
                    <span class="status-badge ${p.activo ? 'status-activo' : 'status-inactivo'}">
                        ${p.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-danger" onclick="eliminarProyecto(${p.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
        
    } catch (error) {
        console.error('Error cargando proyectos:', error);
    }
}

// Cambiar rol de usuario
window.cambiarRol = async function(usuarioId, nuevoRol) {
    try {
        const response = await fetchWithAuth(`${API_URL}/admin/usuarios/${usuarioId}/rol`, {
            method: 'PUT',
            body: JSON.stringify({ rol: nuevoRol })
        });
        
        if (response && response.ok) {
            Swal.fire('Éxito', 'Rol actualizado correctamente', 'success');
            cargarUsuarios();
        }
    } catch (error) {
        console.error('Error cambiando rol:', error);
        Swal.fire('Error', 'No se pudo cambiar el rol', 'error');
    }
};

// Desactivar usuario
window.desactivarUsuario = async function(usuarioId) {
    const confirm = await Swal.fire({
        title: '¿Desactivar usuario?',
        text: 'El usuario no podrá iniciar sesión',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, desactivar'
    });
    
    if (confirm.isConfirmed) {
        try {
            const response = await fetchWithAuth(`${API_URL}/admin/usuarios/${usuarioId}/estado`, {
                method: 'PUT',
                body: JSON.stringify({ activo: false })
            });
            
            if (response && response.ok) {
                Swal.fire('Desactivado', 'Usuario desactivado correctamente', 'success');
                cargarUsuarios();
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo desactivar el usuario', 'error');
        }
    }
};

// Resetear contraseña
window.resetearPassword = async function(usuarioId) {
    const { value: nuevaPassword } = await Swal.fire({
        title: 'Resetear contraseña',
        input: 'password',
        inputLabel: 'Nueva contraseña',
        inputPlaceholder: 'Ingresa la nueva contraseña',
        showCancelButton: true
    });
    
    if (nuevaPassword && nuevaPassword.length >= 6) {
        try {
            const response = await fetchWithAuth(`${API_URL}/admin/usuarios/${usuarioId}/reset-password`, {
                method: 'PUT',
                body: JSON.stringify({ password: nuevaPassword })
            });
            
            if (response && response.ok) {
                Swal.fire('Éxito', 'Contraseña actualizada', 'success');
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo resetear la contraseña', 'error');
        }
    } else if (nuevaPassword) {
        Swal.fire('Error', 'La contraseña debe tener al menos 6 caracteres', 'error');
    }
};

// Eliminar proyecto
window.eliminarProyecto = async function(proyectoId) {
    const confirm = await Swal.fire({
        title: '¿Eliminar proyecto?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar'
    });
    
    if (confirm.isConfirmed) {
        try {
            const response = await fetchWithAuth(`${API_URL}/admin/proyectos/${proyectoId}`, {
                method: 'DELETE'
            });
            
            if (response && response.ok) {
                Swal.fire('Eliminado', 'Proyecto eliminado correctamente', 'success');
                cargarProyectos();
                cargarEstadisticas();
            }
        } catch (error) {
            Swal.fire('Error', 'No se pudo eliminar el proyecto', 'error');
        }
    }
};

// Exportar CSV
window.exportarCSV = async function(tipo) {
    try {
        const response = await fetchWithAuth(`${API_URL}/admin/exportar/${tipo}`);
        const data = await response.json();
        
        let csv = '';
        if (tipo === 'usuarios') {
            csv = 'ID,Nombre,Correo,Código,Programa,Rol,Último Login\n';
            data.forEach(u => {
                csv += `${u.id},"${u.nombre_completo}","${u.correo_institucional}","${u.codigo_estudiantil}","${u.programa_academico}",${u.rol},${u.ultimo_login || ''}\n`;
            });
        } else {
            csv = 'ID,Nombre,Descripción,Creador,Fecha\n';
            data.forEach(p => {
                csv += `${p.id},"${p.nombre}","${p.descripcion || ''}","${p.creador_nombre}",${p.created_at}\n`;
            });
        }
        
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${tipo}_${new Date().toISOString()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        
    } catch (error) {
        console.error('Error exportando:', error);
        Swal.fire('Error', 'No se pudo exportar', 'error');
    }
};

// Buscar usuarios
document.getElementById('buscarUsuario')?.addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#tablaUsuarios tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
});

// Buscar proyectos
document.getElementById('buscarProyecto')?.addEventListener('input', function(e) {
    const term = e.target.value.toLowerCase();
    const rows = document.querySelectorAll('#tablaProyectos tr');
    rows.forEach(row => {
        const text = row.textContent.toLowerCase();
        row.style.display = text.includes(term) ? '' : 'none';
    });
});

// Mostrar nombre del admin
document.getElementById('adminName').textContent = `👑 ${user.nombre || 'Admin'}`;

// Cerrar sesión - actualizado para registrar logout
document.getElementById('cerrarSesion')?.addEventListener('click', async function(e) {
    e.preventDefault();
    
    const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#9ED9CC',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    });
    
    if (result.isConfirmed) {
        try {
            // Registrar logout en el backend
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error registrando logout:', error);
        }
        
        // Limpiar localStorage y redirigir
        localStorage.clear();
        window.location.href = 'login.html';
    }
});

// Inicializar
cargarEstadisticas();
cargarUsuarios();
cargarProyectos();