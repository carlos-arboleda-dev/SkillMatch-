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


// Función para enviar solicitud de amistad
// Enviar solicitud de amistad
window.enviarSolicitudAmistad = async function(codigoUsuario, nombreUsuario) {
    try {
        console.log('Enviando solicitud a:', codigoUsuario, nombreUsuario); // Para depurar
        
        if (!codigoUsuario) {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: 'No se pudo identificar al usuario'
            });
            return;
        }

        // Buscar usuario por código
        const response = await fetch(`${API_URL}/usuarios/codigo/${codigoUsuario}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Usuario no encontrado');
        }
        
        const data = await response.json();
        
        if (data.success) {
            // Enviar solicitud de amistad
            const solicitudResponse = await fetch(`${API_URL}/amistades/solicitud/${data.usuario.id}`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            
            const solicitudData = await solicitudResponse.json();
            
            if (solicitudData.success) {
                Swal.fire({
                    icon: 'success',
                    title: 'Solicitud enviada',
                    text: `Solicitud de amistad enviada a ${nombreUsuario}`,
                    timer: 1500,
                    showConfirmButton: false
                });
                
                // Cambiar el botón temporalmente
                const boton = event.currentTarget;
                boton.style.background = '#9ED9CC';
                boton.innerHTML = '<i class="fas fa-check"></i>';
                setTimeout(() => {
                    boton.style.background = '';
                    boton.innerHTML = '<i class="fas fa-user-plus"></i>';
                }, 2000);
            }
        }
    } catch (error) {
        console.error('Error enviando solicitud:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo enviar la solicitud'
        });
    }
};

// Función para quitar/quitar recomendación
function quitarRecomendacion(boton) {
    const userCard = boton.closest('.user-card');
    const nombreUsuario = userCard.querySelector('h5').textContent;
    
    Swal.fire({
        title: '¿Eliminar recomendación?',
        text: `¿Seguro que quieres eliminar a ${nombreUsuario} de tus recomendaciones?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#9ED9CC',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            // Animación de desvanecimiento
            userCard.style.transition = 'all 0.3s ease';
            userCard.style.opacity = '0';
            userCard.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                userCard.remove();
                
                // Verificar si ya no hay más usuarios
                const remainingCards = document.querySelectorAll('.user-card');
                if (remainingCards.length === 0) {
                    document.getElementById('recomendaciones-container').innerHTML = `
                        <div class="text-center text-muted py-4">
                            <i class="fas fa-users-slash fa-3x mb-3"></i>
                            <p>No hay más recomendaciones</p>
                        </div>
                    `;
                }
                
                Swal.fire({
                    icon: 'success',
                    title: 'Eliminado',
                    text: 'Recomendación eliminada',
                    timer: 1500,
                    showConfirmButton: false
                });
            }, 300);
        }
    });
}

// Hacer las funciones globales
window.enviarSolicitudAmistad = enviarSolicitudAmistad;
window.quitarRecomendacion = quitarRecomendacion;

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


    // Manejar cierre de sesión
document.getElementById('cerrarSesion')?.addEventListener('click', function(e) {
        e.preventDefault();
        
        Swal.fire({
            title: '¿Cerrar sesión?',
            text: '¿Estás seguro que deseas salir?',
            icon: 'question',
            showCancelButton: true,
            confirmButtonColor: '#9ED9CC',
            cancelButtonColor: '#d33',
            confirmButtonText: 'Sí, cerrar sesión',
            cancelButtonText: 'Cancelar'
        }).then((result) => {
            if (result.isConfirmed) {
                // Limpiar localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('justRegistered');
                
                // Redirigir al login
                window.location.href = 'login.html';
            }
        });
    });


// Actualizar badge de notificaciones
async function actualizarBadgeNotificaciones() {
    const response = await fetch(`${API_URL}/notificaciones/contar`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
    const badge = document.getElementById('notificacionesBadge');
    if (badge) {
        if (data.noLeidas > 0) {
            badge.textContent = data.noLeidas;
            badge.style.display = 'inline';
        } else {
            badge.style.display = 'none';
        }
    }
}

// Función para enviar solicitud de amistad
// Enviar solicitud de amistad - AHORA USA EL ID DIRECTAMENTE
// Enviar solicitud de amistad (crea notificación)
window.enviarSolicitudAmistad = async function(usuarioId, nombreUsuario) {
    try {
        const boton = event.currentTarget;
        boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        boton.disabled = true;

        // Crear solicitud de amistad (esto ya debe crear una notificación en el backend)
        const response = await fetch(`${API_URL}/amistades/solicitud/${usuarioId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Solicitud enviada',
                text: `Solicitud enviada a ${nombreUsuario}`,
                timer: 1500,
                showConfirmButton: false
            });
            
            // Feedback visual
            boton.innerHTML = '<i class="fas fa-check"></i>';
            boton.style.background = '#9ED9CC';
            
            setTimeout(() => {
                boton.innerHTML = '<i class="fas fa-user-plus"></i>';
                boton.style.background = '';
                boton.disabled = false;
            }, 2000);
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo enviar la solicitud'
        });
    }
};

// Busca la función mostrarUsuarios y asegúrate que tenga esta estructura:
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

    recomendacionesContainer.innerHTML = usuarios.map(usuario => {
        // Mostrar TODOS los datos del usuario para depurar
        console.log('Usuario completo:', usuario);
        
        // Verificar si tiene código estudiantil
        const codigoEstudiantil = usuario.codigo_estudiantil || usuario.id;
        console.log('Usando código:', codigoEstudiantil);
        
        return `
        <div class="user-card" data-usuario-id="${usuario.id}">
            <div class="d-flex align-items-center mb-3">
                <div class="avatar-circle me-3">
                    ${getIniciales(usuario.nombre_completo)}
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between align-items-start">
                        <div>
                            <h5 class="mb-1">${usuario.nombre_completo}</h5>
                            <p class="text-muted mb-1">
                                <i class="fas fa-graduation-cap me-1"></i>${usuario.programa_academico || ''}
                            </p>
                            <span class="afinidad-badge">
                                <i class="fas fa-heart me-1"></i>${usuario.afinidad || 0}% coincidencia
                            </span>
                        </div>
                        <div class="d-flex gap-2">
                            <!-- Botón de solicitud de amistad - AHORA USA ID DIRECTAMENTE -->
                            <button class="btn-friend-request" 
                                    onclick="enviarSolicitudAmistad('${usuario.id}', '${usuario.nombre_completo}')" 
                                    title="Enviar solicitud de amistad">
                                <i class="fas fa-user-plus"></i>
                            </button>
                            
                            <!-- Botón X para eliminar recomendación -->
                            <button class="btn-remove-recommendation" onclick="quitarRecomendacion(this)" title="Eliminar recomendación">
                                <i class="fas fa-times"></i>
                            </button>
                            
                            <!-- Botón de agregar a proyecto -->
                            <button class="btn-add-project" 
                                    onclick="agregarAProyecto('${usuario.id}', '${usuario.nombre_completo}')" 
                                    title="Agregar a proyecto">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                        </div>
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
    `}).join('');
}

actualizarBadgeNotificaciones();
