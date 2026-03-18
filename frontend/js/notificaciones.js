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

// 🔥 FUNCIÓN UNIFICADA (mezcla de ambos)
async function actualizarContador() {
    try {
        const response = await fetch(`${API_URL}/notificaciones/contar`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();

        // Contador principal
        const contador = document.getElementById('contadorNoLeidas');
        if (contador) contador.textContent = data.noLeidas;
        
        // Badge navbar
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
        console.error('Error actualizando contador:', error);
    }
}

// Alias para no romper tu código anterior
const actualizarBadgeNotificaciones = actualizarContador;


// ✅ TU LÓGICA (se mantiene)
window.responderSolicitud = async function(emisorId, notificacionId, accion) {
    try {
        const notificacion = document.querySelector(`[data-id="${notificacionId}"]`);
        const botonesContainer = notificacion.querySelector('.d-flex.gap-2.mt-2');
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
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: accion === 'aceptar' ? '¡Solicitud aceptada!' : 'Solicitud rechazada',
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
                
                await actualizarContador();
            }
        } else {
            throw new Error(data.error);
        }
    } catch (error) {
        console.error(error);
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
                notificacion.remove();
                actualizarContador();
            }
        }
    } catch (error) {
        console.error(error);
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
            await actualizarContador();
            container.innerHTML = data.notificaciones.map(n => `<div>${n.contenido}</div>`).join('');
        }
    } catch (error) {
        console.error(error);
    }
}

// Manejar cierre de sesión (mezcla correcta)
document.getElementById('cerrarSesion')?.addEventListener('click', function(e) {
    e.preventDefault();
    
    Swal.fire({
        title: '¿Cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonText: 'Sí'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.clear(); // mejor opción (tuya)
            window.location.href = 'login.html';
        }
    });
});

// Inicializar (mezcla de ambos)
document.addEventListener('DOMContentLoaded', function() {
    cargarNotificaciones();
    actualizarContador();
});