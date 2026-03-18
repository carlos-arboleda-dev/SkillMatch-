// frontend/js/feed.js
const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

let proyectoActualId = null;

// Función para abrir modal de comentarios (GLOBAL)
window.abrirComentarios = function(proyectoId, proyectoTitulo) {
    console.log('Abriendo comentarios para proyecto:', proyectoId, proyectoTitulo);
    proyectoActualId = proyectoId;
    
    // Actualizar título del modal
    document.getElementById('comentariosModalLabel').innerHTML = `
        <i class="fas fa-comments me-2"></i>Comentarios - ${proyectoTitulo}
    `;
    
    // Cargar comentarios
    cargarComentarios(proyectoId);
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('comentariosModal'));
    modal.show();
};

// Función para cargar comentarios
async function cargarComentarios(proyectoId) {
    const container = document.getElementById('comentariosContainer');
    
    try {
        const response = await fetch(`${API_URL}/comentarios/proyecto/${proyectoId}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            if (data.comentarios.length === 0) {
                container.innerHTML = `
                    <div class="text-center text-muted py-4">
                        <i class="far fa-comment-dots fa-3x mb-3"></i>
                        <p>No hay comentarios aún. ¡Sé el primero en comentar!</p>
                    </div>
                `;
            } else {
                container.innerHTML = data.comentarios.map(c => `
                    <div class="d-flex mb-3">
                        <div class="avatar-circle me-2" style="width: 40px; height: 40px; font-size: 1rem;">
                            ${getIniciales(c.autor_nombre)}
                        </div>
                        <div class="flex-grow-1">
                            <div class="d-flex justify-content-between">
                                <strong>${c.autor_nombre}</strong>
                                <small class="text-muted">${formatearFecha(c.created_at)}</small>
                            </div>
                            <p class="mb-0">${c.contenido}</p>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando comentarios:', error);
        container.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar comentarios
            </div>
        `;
    }
}

// Función para enviar comentario
document.getElementById('enviarComentarioBtn')?.addEventListener('click', async () => {
    const input = document.getElementById('nuevoComentario');
    const contenido = input.value.trim();
    
    if (!contenido || !proyectoActualId) return;
    
    input.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/comentarios`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                contenido,
                proyecto_id: proyectoActualId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            input.value = '';
            cargarComentarios(proyectoActualId);
        }
    } catch (error) {
        console.error('Error enviando comentario:', error);
    } finally {
        input.disabled = false;
    }
});

// Función para obtener iniciales
function getIniciales(nombre) {
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Función para formatear fecha
function formatearFecha(fecha) {
    const d = new Date(fecha);
    const hoy = new Date();
    const ayer = new Date(hoy);
    ayer.setDate(ayer.getDate() - 1);
    
    if (d.toDateString() === hoy.toDateString()) {
        return `Hoy ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    } else if (d.toDateString() === ayer.toDateString()) {
        return `Ayer ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
    } else {
        return `${d.getDate()}/${d.getMonth()+1}/${d.getFullYear()}`;
    }
}

// Elementos del DOM
const feedContainer = document.querySelector('.feed-container');

// Función para mostrar proyectos (con el botón de comentarios clickeable)
function mostrarProyectos(proyectos) {
    if (!proyectos || proyectos.length === 0) {
        feedContainer.innerHTML = `
            <div class="text-center text-muted py-5">
                <i class="fas fa-folder-open fa-4x mb-3"></i>
                <h5>No hay proyectos aún</h5>
                <p>Sé el primero en <a href="crear_proyecto.html">crear un proyecto</a></p>
            </div>
        `;
        return;
    }

    feedContainer.innerHTML = proyectos.map(proyecto => {
        // Escapar comillas simples en el título para el onclick
        const tituloEscapado = proyecto.titulo.replace(/'/g, "\\'");
        
        return `
        <div class="post-card" data-proyecto-id="${proyecto.id}">
            <div class="post-header">
                <div class="avatar-circle me-3">
                    ${getIniciales(proyecto.autor.nombre)}
                </div>
                <div>
                    <div class="post-author">${proyecto.autor.nombre}</div>
                    <div class="post-time">
                        <i class="far fa-clock me-1"></i>${proyecto.tiempo}
                        ${proyecto.autor.programa ? `<span class="ms-2">(${proyecto.autor.programa})</span>` : ''}
                    </div>
                </div>
            </div>
            
            <h3 class="post-title">${proyecto.titulo}</h3>
            <p class="post-description">${proyecto.descripcion}</p>
            
            <span class="post-category">
                <i class="fas ${proyecto.categoria.icono} me-1"></i>${proyecto.categoria.nombre}
            </span>
            
            <div class="post-stats">
                <span class="stat-item" onclick="toggleLike(${proyecto.id}, this)" style="cursor: pointer;">
                    <i class="far fa-heart"></i> <span class="like-count">${proyecto.likes}</span>
                </span>
                <!-- Botón de comentarios clickeable -->
                <span class="stat-item" onclick="abrirComentarios(${proyecto.id}, '${tituloEscapado}')" style="cursor: pointer;">
                    <i class="far fa-comment"></i> ${proyecto.comentarios}
                </span>
            </div>
            
            <!-- Botón de unirse al proyecto -->
            <div class="text-end mt-3">
                <button class="btn-join" onclick="unirseAProyecto(${proyecto.id}, '${tituloEscapado}')">
                    <i class="fas fa-user-plus me-1"></i>Unirse al proyecto
                </button>
            </div>
        </div>
    `}).join('');
}

// Función para unirse a proyecto
// Función para unirse a proyecto
window.unirseAProyecto = async function(proyectoId, proyectoNombre) {
    try {
        const response = await fetch(`${API_URL}/proyectos/${proyectoId}/unirse`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Te has unido!',
                text: `Ahora eres parte de: ${proyectoNombre}`,
                timer: 2000,
                showConfirmButton: false
            });
            
            // Cambiar estado del botón
            const boton = document.querySelector(`[data-proyecto-id="${proyectoId}"] .btn-join`);
            if (boton) {
                boton.textContent = '✓ Unido';
                boton.style.background = '#9ED9CC';
                boton.disabled = true;
            }
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.error || 'No se pudo unir al proyecto'
            });
        }
    } catch (error) {
        console.error('Error al unirse:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error de conexión'
        });
    }
};

// Cargar feed al iniciar
async function cargarFeed() {
    try {
        const response = await fetch(`${API_URL}/proyectos/feed`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            mostrarProyectos(data.proyectos);
        }
    } catch (error) {
        console.error('Error cargando feed:', error);
        feedContainer.innerHTML = `
            <div class="alert alert-danger">
                Error al cargar proyectos. Intenta de nuevo.
            </div>
        `;
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

// Función para dar/quitar like
window.toggleLike = async function(proyectoId, elemento) {
    try {
        const response = await fetch(`${API_URL}/likes/proyecto/${proyectoId}/toggle`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Actualizar el contador y el icono
            const likeSpan = elemento.closest('.stat-item');
            const likeIcon = likeSpan.querySelector('i');
            const likeCount = likeSpan.querySelector('.like-count') || likeSpan;
            
            // Actualizar contador
            if (likeCount.tagName === 'SPAN' && likeCount.classList.contains('like-count')) {
                likeCount.textContent = data.likes_count;
            } else {
                // Si no hay elemento separado, actualizar todo el texto
                likeSpan.innerHTML = `<i class="${data.liked ? 'fas' : 'far'} fa-heart"></i> ${data.likes_count}`;
            }
            
            // Animar el cambio
            likeIcon.style.transform = 'scale(1.3)';
            setTimeout(() => {
                likeIcon.style.transform = 'scale(1)';
            }, 200);
        }
    } catch (error) {
        console.error('Error dando like:', error);
    }
};

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
actualizarBadgeNotificaciones();

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarFeed();
    actualizarBadgeNotificaciones();
});