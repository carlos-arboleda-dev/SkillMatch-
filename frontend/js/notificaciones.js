const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

function getIniciales(nombre) {
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

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

async function actualizarBadgeNotificaciones() {
    try {
        const response = await fetch(`${API_URL}/notificaciones/contar`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        
        const contador = document.getElementById('contadorNoLeidas');
        if (contador) contador.textContent = data.noLeidas;
        
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

window.responderSolicitud = async function(emisorId, notificacionId, accion) {
    try {
        console.log(`📤 ${accion} solicitud de usuario:`, emisorId);
        
        const notificacion = document.querySelector(`[data-id="${notificacionId}"]`);
        const botonesContainer = notificacion?.querySelector('.d-flex.gap-2.mt-2');
        const botonAceptar = botonesContainer?.querySelector('.btn-aceptar');
        const botonRechazar = botonesContainer?.querySelector('.btn-rechazar');
        
        if (botonAceptar) botonAceptar.disabled = true;
        if (botonRechazar) botonRechazar.disabled = true;
        
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
            
            if (notificacion) {
                notificacion.classList.add('leida');
                notificacion.classList.remove('no-leida');
                
                if (botonesContainer) {
                    botonesContainer.innerHTML = `
                        <span class="badge ${accion === 'aceptar' ? 'bg-success' : 'bg-secondary'}">
                            ${accion === 'aceptar' ? '✓ Aceptada' : '✗ Rechazada'}
                        </span>
                    `;
                }
                
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
        
        const notificacion = document.querySelector(`[data-id="${notificacionId}"]`);
        const botonesContainer = notificacion?.querySelector('.d-flex.gap-2.mt-2');
        if (botonesContainer) {
            botonesContainer.querySelectorAll('button').forEach(btn => btn.disabled = false);
        }
    }
};

// FUNCIÓN CORREGIDA - usa proyecto_id en el endpoint
window.responderInvitacionProyecto = async function(proyectoId, notificacionId, nombreProyecto, accion) {
    try {
        console.log('📤 Respondiendo invitación:', { proyectoId, notificacionId, nombreProyecto, accion });
        
        const notificacion = document.querySelector(`[data-id="${notificacionId}"]`);
        const botonesContainer = notificacion?.querySelector('.d-flex.gap-2.mt-2');
        if (botonesContainer) {
            botonesContainer.querySelectorAll('button').forEach(btn => btn.disabled = true);
        }

        const response = await fetch(`${API_URL}/invitaciones/${proyectoId}/${accion}`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        console.log('📥 Respuesta:', data);
        
        if (data.success) {
            // MARCAR NOTIFICACIÓN COMO LEÍDA EN EL BACKEND
            await fetch(`${API_URL}/notificaciones/${notificacionId}/leer`, {
                method: 'PUT',
                headers: { 'Authorization': `Bearer ${token}` }
            });

            Swal.fire({
                icon: 'success',
                title: accion === 'aceptar' ? '¡Te has unido!' : 'Invitación rechazada',
                text: accion === 'aceptar'
                    ? `Ahora eres parte del proyecto "${nombreProyecto}"`
                    : `Has rechazado la invitación a "${nombreProyecto}"`,
                timer: 2000,
                showConfirmButton: false
            });
            
            if (notificacion) {
                notificacion.classList.add('leida');
                notificacion.classList.remove('no-leida');
                
                if (botonesContainer) {
                    botonesContainer.innerHTML = `
                        <span class="badge ${accion === 'aceptar' ? 'bg-success' : 'bg-secondary'}">
                            ${accion === 'aceptar' ? '✓ Aceptada' : '✗ Rechazada'}
                        </span>
                    `;
                }
            }
            
            await actualizarBadgeNotificaciones();
        } else {
            throw new Error(data.error || 'Error al procesar invitación');
        }
    } catch (error) {
        console.error('❌ Error respondiendo invitación:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: error.message || 'No se pudo procesar la invitación'
        });
        
        const notificacion = document.querySelector(`[data-id="${notificacionId}"]`);
        const botonesContainer = notificacion?.querySelector('.d-flex.gap-2.mt-2');
        if (botonesContainer) {
            botonesContainer.querySelectorAll('button').forEach(btn => btn.disabled = false);
        }
    }
};

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
                <div class="notification-card ${!n.leido ? 'no-leida' : ''}" 
                     data-id="${n.id}" 
                     data-tipo="${n.tipo}" 
                     data-emisor-id="${n.emisor_id}" 
                     data-proyecto-id="${n.proyecto_id || ''}">
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
                            
                            ${n.tipo === 'invitacion_proyecto' && !n.leido ? `
                            <div class="d-flex gap-2 mt-2">
                                <button class="btn-aceptar btn-sm" 
                                    onclick="responderInvitacionProyecto(${n.proyecto_id}, ${n.id}, '${n.proyecto_nombre || ''}', 'aceptar')">
                                    <i class="fas fa-check me-1"></i>Aceptar
                                </button>
                                <button class="btn-rechazar btn-sm" 
                                    onclick="responderInvitacionProyecto(${n.proyecto_id}, ${n.id}, '${n.proyecto_nombre || ''}', 'rechazar')">
                                    <i class="fas fa-times me-1"></i>Rechazar
                                </button>
                            </div>
                            ` : ''}
                            
                            ${(n.tipo !== 'solicitud_amistad' && n.tipo !== 'invitacion_proyecto') || n.leido ? `
                            <div class="mt-1">
                                <small class="text-muted">
                                    ${n.tipo === 'like' ? '❤️' : 
                                      n.tipo === 'comentario' ? '💬' : 
                                      n.tipo === 'amistad_aceptada' ? '👥' : 
                                      n.tipo === 'invitacion_aceptada' ? '✅' : '📢'}
                                </small>
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

document.addEventListener('click', async (e) => {
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

document.addEventListener('DOMContentLoaded', function() {
    cargarNotificaciones();
});