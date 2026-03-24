const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const recomendacionesContainer = document.getElementById('recomendaciones-container');
const proyectosContainer = document.getElementById('proyectos-container');

function getIniciales(nombre) {
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

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

async function cargarRecomendaciones() {
    try {
        const response = await fetch(`${API_URL}/recomendaciones/usuarios?limite=10`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        if (!response.ok) throw new Error('Error al cargar recomendaciones');

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
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        mostrarUsuarios(data.usuarios);
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('error', 'Error en la búsqueda');
    }
}

window.buscarPorTag = function(tag) {
    searchInput.value = tag;
    buscarPorPalabra(tag);
};

window.agregarAProyecto = async function(usuarioId, nombreUsuario) {
    try {
        sessionStorage.setItem('invitarUsuarioId', usuarioId);
        sessionStorage.setItem('invitarUsuarioNombre', nombreUsuario);
        
        const response = await fetch(`${API_URL}/proyectos/mis-proyectos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const proyectos = await response.json();
        
        if (!proyectos || proyectos.length === 0) {
            Swal.fire({
                icon: 'info',
                title: 'Sin proyectos',
                text: 'No tienes proyectos para invitar. Crea uno primero.',
                confirmButtonColor: '#9ED9CC'
            }).then(() => {
                window.location.href = 'crear_proyecto.html';
            });
            return;
        }
        
        let opciones = '<option value="">Selecciona un proyecto</option>';
        proyectos.forEach(p => {
            opciones += `<option value="${p.id}">${p.nombre} (${p.numero_integrantes} integrantes)</option>`;
        });
        
        Swal.fire({
            title: `Invitar a ${nombreUsuario}`,
            html: `
                <p>Selecciona el proyecto al que quieres invitar:</p>
                <select id="proyectoSelect" class="form-select" style="margin-bottom: 1rem;">
                    ${opciones}
                </select>
                <p class="text-muted small">El usuario recibirá una notificación para aceptar o rechazar</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Enviar invitación',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#9ED9CC',
            cancelButtonColor: '#d33',
            preConfirm: () => {
                const proyectoId = document.getElementById('proyectoSelect').value;
                if (!proyectoId) {
                    Swal.showValidationMessage('Debes seleccionar un proyecto');
                    return false;
                }
                return proyectoId;
            }
        }).then(async (result) => {
            if (result.isConfirmed) {
                await enviarInvitacionProyecto(usuarioId, result.value, nombreUsuario);
            }
        });
        
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudieron cargar tus proyectos'
        });
    }
};

async function enviarInvitacionProyecto(usuarioId, proyectoId, nombreUsuario) {
    try {
        const response = await fetch(`${API_URL}/invitaciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                proyecto_id: proyectoId,
                usuario_invitado: usuarioId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Invitación enviada',
                text: `Has invitado a ${nombreUsuario} al proyecto`,
                timer: 2000,
                showConfirmButton: false
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'No se pudo enviar la invitación'
            });
        }
    } catch (error) {
        console.error('Error enviando invitación:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo enviar la invitación'
        });
    }
}

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

// Enviar solicitud de amistad
window.enviarSolicitudAmistad = async function(usuarioId, nombreUsuario) {
    try {
        const boton = event.currentTarget;
        boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        boton.disabled = true;

        const response = await fetch(`${API_URL}/amistades/solicitud/${usuarioId}`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Solicitud enviada!',
                text: data.mensajeAmigable || `Solicitud enviada a ${nombreUsuario}`,
                timer: 1500,
                showConfirmButton: false
            });
            
            boton.innerHTML = '<i class="fas fa-check"></i>';
            boton.style.background = '#9ED9CC';
            
            setTimeout(() => {
                boton.innerHTML = '<i class="fas fa-user-plus"></i>';
                boton.style.background = '';
                boton.disabled = false;
            }, 2000);
        } else {
            let mensaje = '';
            let icono = 'error';
            
            switch (data.tipo) {
                case 'ya_amigos':
                    mensaje = `✅ Ya eres amigo de ${nombreUsuario}`;
                    icono = 'info';
                    boton.innerHTML = '<i class="fas fa-user-check"></i>';
                    break;
                case 'ya_enviada':
                    mensaje = `📨 Ya enviaste una solicitud a ${nombreUsuario}`;
                    icono = 'info';
                    break;
                case 'recibida':
                    mensaje = `🔔 ${nombreUsuario} ya te envió una solicitud. Revisa tus notificaciones.`;
                    icono = 'info';
                    break;
                default:
                    mensaje = data.mensajeAmigable || data.error || 'No se pudo enviar la solicitud';
            }
            
            Swal.fire({
                icon: icono,
                title: mensaje.includes('✅') || mensaje.includes('📨') || mensaje.includes('🔔') ? 'Información' : 'Error',
                text: mensaje,
                timer: 2500,
                showConfirmButton: false
            });
            
            boton.disabled = false;
            if (data.tipo !== 'ya_amigos') {
                boton.innerHTML = '<i class="fas fa-user-plus"></i>';
            }
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo enviar la solicitud'
        });
        const boton = event.currentTarget;
        boton.disabled = false;
        boton.innerHTML = '<i class="fas fa-user-plus"></i>';
    }
};

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
            userCard.style.transition = 'all 0.3s ease';
            userCard.style.opacity = '0';
            userCard.style.transform = 'translateX(100px)';
            
            setTimeout(() => {
                userCard.remove();
                
                if (document.querySelectorAll('.user-card').length === 0) {
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

window.quitarRecomendacion = quitarRecomendacion;

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
                            <button class="btn-friend-request" 
                                    onclick="enviarSolicitudAmistad('${usuario.id}', '${usuario.nombre_completo}')" 
                                    title="Enviar solicitud de amistad">
                                <i class="fas fa-user-plus"></i>
                            </button>
                            <button class="btn-remove-recommendation" 
                                    onclick="quitarRecomendacion(this)" 
                                    title="Eliminar recomendación">
                                <i class="fas fa-times"></i>
                            </button>
                            <button class="btn-add-project" 
                                    onclick="agregarAProyecto('${usuario.id}', '${usuario.nombre_completo}')" 
                                    title="Agregar a proyecto">
                                <i class="fas fa-plus-circle"></i>
                            </button>
                        </div>
                    </div>
                </div>
            </div>
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

async function actualizarBadgeNotificaciones() {
    try {
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
    } catch (error) {
        console.error('Error badge:', error);
    }
}

searchBtn.addEventListener('click', () => {
    buscarPorPalabra(searchInput.value);
});

searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') buscarPorPalabra(searchInput.value);
});

document.addEventListener('DOMContentLoaded', () => {
    cargarRecomendaciones();
    actualizarBadgeNotificaciones();
});

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