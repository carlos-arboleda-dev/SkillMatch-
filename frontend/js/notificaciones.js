const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'login.html';

// Cargar notificaciones
async function cargarNotificaciones() {
    try {
        const response = await fetch(`${API_URL}/notificaciones`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            actualizarContador(data.noLeidas);
            mostrarNotificaciones(data.notificaciones);
        }
    } catch (error) {
        console.error('Error cargando notificaciones:', error);
    }
}

// Mostrar notificaciones
function mostrarNotificaciones(notificaciones) {
    const container = document.getElementById('notificacionesContainer');
    
    if (notificaciones.length === 0) {
        container.innerHTML = `
            <div class="text-center text-white py-5">
                <i class="far fa-bell-slash fa-4x mb-3"></i>
                <h5>No hay notificaciones</h5>
                <p>Cuando tengas actividad, aparecerá aquí</p>
            </div>
        `;
        return;
    }
    
    container.innerHTML = notificaciones.map(n => `
        <div class="notification-card ${!n.leido ? 'no-leida' : ''}" data-id="${n.id}">
            <div class="d-flex align-items-center gap-3">
                <div class="avatar-circle">
                    ${getIniciales(n.emisor_nombre)}
                </div>
                <div class="flex-grow-1">
                    <div class="d-flex justify-content-between">
                        <div>
                            <strong>${n.emisor_nombre}</strong>
                            <span class="text-muted">${n.emisor_codigo ? `(${n.emisor_codigo})` : ''}</span>
                        </div>
                        <small class="text-muted">${formatearFecha(n.created_at)}</small>
                    </div>
                    <p class="mb-1">${n.contenido}</p>
                    ${n.proyecto_nombre ? `
                        <span class="badge-notificacion">
                            <i class="fas fa-project-diagram me-1"></i>${n.proyecto_nombre}
                        </span>
                    ` : ''}
                </div>
                <button class="btn-close-notification" onclick="eliminarNotificacion(${n.id})">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        </div>
    `).join('');
}

// Marcar como leída al hacer clic
document.addEventListener('click', async (e) => {
    const notificacion = e.target.closest('.notification-card');
    if (notificacion && notificacion.classList.contains('no-leida')) {
        const id = notificacion.dataset.id;
        await fetch(`${API_URL}/notificaciones/${id}/leer`, {
            method: 'PUT',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        notificacion.classList.remove('no-leida');
        actualizarContador();
    }
});

// Funciones auxiliares
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

async function actualizarContador() {
    const response = await fetch(`${API_URL}/notificaciones/contar`, {
        headers: { 'Authorization': `Bearer ${token}` }
    });
    const data = await response.json();
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
}

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
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('justRegistered');
            window.location.href = 'login.html';
        }
    });
});

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarNotificaciones();
    actualizarContador();
});