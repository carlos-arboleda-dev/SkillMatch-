const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

// Elementos del DOM
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const recomendacionesContainer = document.getElementById('recomendaciones-container');
const proyectosContainer = document.getElementById('proyectos-container');

// Función para obtener iniciales
function getIniciales(nombre) {
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Función para mostrar usuarios
function mostrarUsuarios(usuarios) {
    if (!usuarios || usuarios.length === 0) {
        recomendacionesContainer.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-user-slash fa-3x mb-3"></i>
                <p>No se encontraron personas con intereses similares</p>
            </div>
        `;
        return;
    }

    recomendacionesContainer.innerHTML = usuarios.map(usuario => `
        <div class="user-card">
            <div class="d-flex align-items-center mb-3">
                <div class="avatar-circle me-3">
                    ${getIniciales(usuario.nombre_completo)}
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="mb-1">${usuario.nombre_completo}</h5>
                            <p class="text-muted mb-1">
                                <i class="fas fa-graduation-cap me-1"></i>${usuario.programa_academico}
                            </p>
                            <span class="afinidad-badge">
                                <i class="fas fa-heart me-1"></i>${usuario.afinidad || 0}% coincidencia
                            </span>
                        </div>
                        <button class="btn-add-project" onclick="agregarAProyecto('${usuario.codigo_estudiantil}', '${usuario.nombre_completo}')">
                            <i class="fas fa-plus-circle me-1"></i>Agregar a Proyecto
                        </button>
                    </div>
                </div>
            </div>
            
            <!-- Mostrar intereses comunes -->
            <div class="mt-2">
                <small class="text-muted">Intereses:</small>
                <div class="d-flex flex-wrap gap-2 mt-1">
                    ${usuario.interes_academico ? usuario.interes_academico.map(i => 
                        `<span class="badge bg-success bg-opacity-10 text-dark p-2">${i}</span>`
                    ).join('') : '<span class="text-muted">No especificados</span>'}
                </div>
            </div>
        </div>
    `).join('');
}

// Función para mostrar proyectos
function mostrarProyectos(proyectos) {
    if (!proyectos || proyectos.length === 0) {
        proyectosContainer.innerHTML = `
            <div class="text-center text-muted py-4">
                <i class="fas fa-folder-open fa-3x mb-3"></i>
                <p>No hay proyectos relacionados</p>
            </div>
        `;
        return;
    }

    proyectosContainer.innerHTML = proyectos.map(proyecto => `
        <div class="project-card d-flex justify-content-between align-items-center">
            <div>
                <h6 class="mb-1">${proyecto.titulo || 'Proyecto sin título'}</h6>
                <small class="text-muted">
                    <i class="fas fa-user me-1"></i>${proyecto.autor_nombre || 'Autor desconocido'}
                </small>
            </div>
            <div>
                <a href="#" class="btn-project me-2" onclick="invitarAProyecto(${proyecto.id})">
                    <i class="fas fa-user-plus me-1"></i>Invitar
                </a>
                <a href="#" class="btn-project" onclick="entrarAProyecto(${proyecto.id})">
                    <i class="fas fa-sign-in-alt me-1"></i>Entrar
                </a>
            </div>
        </div>
    `).join('');
}

// Cargar recomendaciones iniciales
async function cargarRecomendaciones() {
    try {
        const response = await fetch(`${API_URL}/recomendaciones/usuarios?limite=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        if (!response.ok) {
            throw new Error('Error al cargar recomendaciones');
        }

        const data = await response.json();
        mostrarUsuarios(data.usuarios);
    } catch (error) {
        console.error('Error:', error);
        recomendacionesContainer.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar recomendaciones. Intenta de nuevo.
            </div>
        `;
    }
}

// Buscar por palabra clave
async function buscarPorPalabra(clave) {
    if (!clave.trim()) {
        cargarRecomendaciones();
        return;
    }

    recomendacionesContainer.innerHTML = `
        <div class="text-center text-muted py-4">
            <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
            <p>Buscando...</p>
        </div>
    `;

    try {
        const response = await fetch(`${API_URL}/recomendaciones/buscar?q=${encodeURIComponent(clave)}&limite=10`, {
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await response.json();
        mostrarUsuarios(data.usuarios);
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('error', 'Error en la búsqueda');
    }
}

// Función para buscar por tag (desde los filtros)
window.buscarPorTag = function(tag) {
    searchInput.value = tag;
    buscarPorPalabra(tag);
};

// Funciones para acciones (placeholder)
window.agregarAProyecto = function(codigo, nombre) {
    Swal.fire({
        title: 'Agregar a proyecto',
        text: `¿A qué proyecto quieres agregar a ${nombre}?`,
        input: 'select',
        inputOptions: {
            'proyecto1': 'Estudio de Ecosistemas',
            'proyecto2': 'Programación en Python',
            'proyecto3': 'Plataforma Educativa'
        },
        showCancelButton: true,
        confirmButtonText: 'Agregar',
        cancelButtonText: 'Cancelar'
    });
};

window.invitarAProyecto = function(proyectoId) {
    Swal.fire('Invitación enviada', 'Se ha notificado al usuario', 'success');
};

window.entrarAProyecto = function(proyectoId) {
    Swal.fire('Solicitud enviada', 'Espera la confirmación del administrador', 'info');
};

function mostrarAlerta(tipo, mensaje) {
    Swal.fire({
        icon: tipo,
        title: tipo === 'success' ? 'Éxito' : 'Error',
        text: mensaje,
        timer: 2000
    });
}

// Event listeners
searchBtn.addEventListener('click', () => {
    buscarPorPalabra(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        buscarPorPalabra(searchInput.value);
    }
});

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarRecomendaciones();
    // También podríamos cargar proyectos recomendados
    // cargarProyectosRecomendados();
});