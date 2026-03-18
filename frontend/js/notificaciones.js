// frontend/js/notificaciones.js
const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

// Función para obtener iniciales
function getIniciales(nombre) {
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Función para formatear fecha
function formatearFecha(fecha) {
    const d = new Date(fecha);
    const hoy = new Date();
    const diff = hoy - d;
    const minutos = Math.floor(diff / 60000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (minutos < 1440) return `Hace ${Math.floor(minutos/60)} h`;
    return d.toLocaleDateString();
}

// Función para actualizar badge de notificaciones (VERSIÓN COMBINADA)
async function actualizarBadgeNotificaciones() {
    try {
        const response = await fetch(`${API_URL}/notificaciones/contar`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        // Actualizar contador en el modal
        const contador = document.getElementById('contadorNoLeidas');
        if (contador) contador.textContent = data.noLeidas;
        
        // Actualizar badge en el navbar
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
        console.error('Error actualizando badge:', error);
    }
}

// Función para responder solicitud de amistad
window.responderSolicitud = async function(emisorId, notificacionId, accion) {
    try {
        console.log(`📤 ${accion} solicitud de usuario:`, emisorId);
        
        // Mostrar loading en los botones
        const notificacion = document.querySelector(`[data-id="${notificacionId}"]`);
        const botonesContainer = notificacion.querySelector('.d-flex.gap-2.mt-2');
        const botonAceptar = botonesContainer?.querySelector('.btn-aceptar');
        const botonRechazar = botonesContainer?.querySelector('.btn-rechazar');
        
        if (botonAceptar) botonAceptar.disabled = true;
        if (botonRechazar) botonRechazar.disabled = true;
        
        // Determinar el endpoint correcto
        const endpoint = accion === 'aceptar' 
            ? `${API_URL}/amistades/aceptar/${emisorId}`
            : `${API_URL}/amistades/rechazar/${emisorId}`;
        
        const response = await fetch(endpoint, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        console.log('📥 Respuesta:', data);
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: accion === 'aceptar' ? '¡Solicitud aceptada!' : 'Solicitud rechazada',
                text: data.message || `Has ${accion === 'aceptar' ? 'aceptado' : 'rechazado'} la solicitud`,
                timer: 1500,
                showConfirmButton: false
            });
            
            // Marcar notificación como leída y ocultar botones
            if (notificacion) {
                notificacion.classList.add('leida');
                notificacion.classList.remove('no-leida');
                
                // Reemplazar botones con mensaje de confirmación
                if (botonesContainer) {
                    botonesContainer.innerHTML = `
                        <span class="badge ${accion === 'aceptar' ? 'bg-success' : 'bg-secondary'}">
                            ${accion === 'aceptar' ? '✓ Aceptada' : '✗ Rechazada'}
                        </span>
                    `;
                }
                
                // Actualizar badge
                await actualizarBadgeNotificaciones();
            }
        } else {
            throw new Error(data.error || 'Error al procesar solicitud');
        }
    } catch (error) {
        console.error('❌ Error respondiendo solicitud:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo procesar la solicitud'
        });
        
        // Restaurar botones
        const notificacion = document.querySelector(`[data-id="${notificacionId}"]`);
        const botonesContainer = notificacion?.querySelector('.d-flex.gap-2.mt-2');
        if (botonesContainer) {
            const botones = botonesContainer.querySelectorAll('button');
            botones.forEach(btn => btn.disabled = false);
        }
    }
};

// Función para responder invitación a proyecto
window.responderInvitacionProyecto = async function(proyectoId, invitacionId, nombreProyecto, accion) {
    try {
        const response = await fetch(`${API_URL}/invitaciones/${invitacionId}/${accion}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: accion === 'aceptar' ? '¡Te has unido!' : 'Invitación rechazada',
                text: accion === 'aceptar' 
                    ? `Ahora eres parte del proyecto "${nombreProyecto}"`
                    : `Has rechazado la invitación a "${nombreProyecto}"`,
                timer: 2000,
                showConfirmButton: false
            });
            
            // Marcar notificación como leída
            const notificacion = document.querySelector(`[data-id="${invitacionId}"]`);
            if (notificacion) {
                notificacion.classList.add('leida');
                notificacion.classList.remove('no-leida');
                
                // Ocultar botones
                const botones = notificacion.querySelector('.d-flex.gap-2.mt-2');
                if (botones) {
                    botones.innerHTML = `
                        <span class="badge ${accion === 'aceptar' ? 'bg-success' : 'bg-secondary'}">
                            ${accion === 'aceptar' ? '✓ Aceptada' : '✗ Rechazada'}
                        </span>
                    `;
                }
            }
            
            await actualizarBadgeNotificaciones();
        }
    } catch (error) {
        console.error('Error respondiendo invitación:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo procesar la invitación'
        });
    }
};

// Eliminar notificación
window.eliminarNotificacion = async function(id) {
    try {
        const response = await fetch(`${API_URL}/notificaciones/${id}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const notificacion = document.querySelector(`[data-id="${id}"]`);
            if (notificacion) {
                notificacion.style.transition = 'all 0.3s ease';
                notificacion.style.opacity = '0';
                notificacion.style.transform = 'translateX(100px)';
                
                setTimeout(() => {
                    notificacion.remove();
                    actualizarBadgeNotificaciones();
                    
                    // Verificar si ya no hay notificaciones
                    if (document.querySelectorAll('.notification-card').length === 0) {
                        document.getElementById('notificacionesContainer').innerHTML = `
                            <div class="text-center text-white py-5">
                                <i class="far fa-bell-slash fa-4x mb-3"></i>
                                <h5>No hay notificaciones</h5>
                            </div>
                        `;
                    }
                }, 300);
            }
        }
    } catch (error) {
        console.error('Error eliminando notificación:', error);
    }
};

// Cargar notificaciones
async function cargarNotificaciones() {
    try {
        const response = await fetch(`${API_URL}/notificaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        const container = document.getElementById('notificacionesContainer');
        
        if (data.success) {
            await actualizarBadgeNotificaciones();
            
            if (data.notificaciones.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-white py-5">
                        <i class="far fa-bell-slash fa-4x mb-3"></i>
                        <h5>No hay notificaciones</h5>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = data.notificaciones.map(n => `
                <div class="notification-card ${!n.leido ? 'no-leida' : ''}" data-id="${n.id}" data-tipo="${n.tipo}" data-emisor-id="${n.emisor_id}" data-proyecto-id="${n.proyecto_id || ''}">
                    <div class="d-flex align-items-center gap-3">
                        <div class="avatar-circle">
                            ${getIniciales(n.emisor_nombre)}
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between">
                                <strong>${n.emisor_nombre}</strong>
                                <small class="text-muted">${formatearFecha(n.created_at)}</small>
                            </div>
                            <p class="mb-2">${n.contenido}</p>
                            
                            <!-- Botones para solicitudes de amistad -->
                            ${n.tipo === 'solicitud_amistad' && !n.leido ? `
                            <div class="d-flex gap-2 mt-2">
                                <button class="btn-aceptar btn-sm" onclick="responderSolicitud(${n.emisor_id}, ${n.id}, 'aceptar')">
                                    <i class="fas fa-check me-1"></i>Aceptar
                                </button>
                                <button class="btn-rechazar btn-sm" onclick="responderSolicitud(${n.emisor_id}, ${n.id}, 'rechazar')">
                                    <i class="fas fa-times me-1"></i>Rechazar
                                </button>
                            </div>
                            ` : ''}
                            
                            <!-- Botones para invitaciones a proyecto -->
                            ${n.tipo === 'invitacion_proyecto' && !n.leido ? `
                            <div class="d-flex gap-2 mt-2">
                                <button class="btn-aceptar btn-sm" onclick="responderInvitacionProyecto(${n.proyecto_id}, ${n.id}, '${n.proyecto_nombre || 'proyecto'}', 'aceptar')">
                                    <i class="fas fa-check me-1"></i>Aceptar
                                </button>
                                <button class="btn-rechazar btn-sm" onclick="responderInvitacionProyecto(${n.proyecto_id}, ${n.id}, '${n.proyecto_nombre || 'proyecto'}', 'rechazar')">
                                    <i class="fas fa-times me-1"></i>Rechazar
                                </button>
                            </div>
                            ` : ''}
                            
                            <!-- Para notificaciones ya leídas, mostrar ícono -->
                            ${(n.tipo !== 'solicitud_amistad' && n.tipo !== 'invitacion_proyecto') || n.leido ? `
                            <div class="mt-1">
                                <small class="text-muted">${n.tipo === 'like' ? '❤️' : n.tipo === 'comentario' ? '💬' : n.tipo === 'amistad_aceptada' ? '👥' : '📢'}</small>
                            </div>
                            ` : ''}
                        </div>
                        <button class="btn-close-notification" onclick="eliminarNotificacion(${n.id})">
                            <i class="fas fa-times"></i>
                        </button>
                    </div>
                </div>
            `).join('');
        }
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
        document.getElementById('notificacionesContainer').innerHTML = `
            <div class="alert alert-danger">
                Error al cargar notificaciones
            </div>
        `;
    }
}

// Marcar como leída al hacer clic (excepto en botones)
document.addEventListener('click', async (e) => {
    // No hacer nada si se hizo clic en un botón o enlace
    if (e.target.closest('button') || e.target.closest('a')) return;
    
    const notificacion = e.target.closest('.notification-card');
    if (notificacion && notificacion.classList.contains('no-leida')) {
        const id = notificacion.dataset.id;
        try {
            await fetch(`${API_URL}/notificaciones/${id}/leer`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });
            notificacion.classList.remove('no-leida');
            actualizarBadgeNotificaciones();
        } catch (error) {
            console.error('Error marcando como leída:', error);
        }
    }
});

// Cerrar sesión
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
            localStorage.clear();
            window.location.href = 'login.html';
        }
    });
});

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarNotificaciones();
});