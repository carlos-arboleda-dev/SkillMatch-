// frontend/js/feed.js
const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

let proyectoActualId = null;
let usuarioActual = null;
let comentarioEnEdicion = null;
let proyectoEnEdicion = null;

// Obtener usuario actual
try {
    usuarioActual = JSON.parse(localStorage.getItem('user'));
    console.log('Usuario actual:', usuarioActual);
} catch (error) {
    console.error('Error obteniendo usuario actual:', error);
}

// Variable global para el proyecto actual
let proyectoActualInvitar = null;

// Mostrar modal para invitar amigos
window.mostrarAmigosParaInvitar = async function(proyectoId, proyectoTitulo) {
    proyectoActualInvitar = proyectoId;
    document.getElementById('proyectoNombreModal').textContent = proyectoTitulo;
    
    // Cargar amigos
    await cargarAmigosParaInvitar();
    
    // Abrir modal
    const modal = new bootstrap.Modal(document.getElementById('invitarAmigosModal'));
    modal.show();
};

// Cargar amigos para invitar
async function cargarAmigosParaInvitar() {
    try {
        const response = await fetch(`${API_URL}/amistades/amigos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        const lista = document.getElementById('amigosLista');
        
        if (data.success && data.amigos.length > 0) {
            lista.innerHTML = data.amigos.map(amigo => `
                <div class="amigo-item">
                    <div class="amigo-info">
                        <div class="amigo-avatar">${getIniciales(amigo.nombre_completo)}</div>
                        <div>
                            <strong>${amigo.nombre_completo}</strong>
                            <small class="d-block text-muted">${amigo.programa_academico || ''}</small>
                        </div>
                    </div>
                    <button class="btn-invitar-amigo" onclick="invitarAmigoAProyecto(${amigo.id}, '${amigo.nombre_completo}')">
                        <i class="fas fa-paper-plane me-1"></i>Invitar
                    </button>
                </div>
            `).join('');
        } else {
            lista.innerHTML = `
                <div class="text-center text-muted py-4">
                    <i class="fas fa-user-friends fa-3x mb-3"></i>
                    <p>No tienes amigos aún</p>
                    <small>Agrega amigos desde la página de búsqueda</small>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error cargando amigos:', error);
    }
}

// Invitar amigo a proyecto
window.invitarAmigoAProyecto = async function(amigoId, amigoNombre) {
    try {
        const response = await fetch(`${API_URL}/invitaciones`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                proyecto_id: proyectoActualInvitar,
                usuario_invitado: amigoId
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Invitación enviada',
                text: `Has invitado a ${amigoNombre} al proyecto`,
                timer: 1500,
                showConfirmButton: false
            });
            
            // Cerrar modal
            bootstrap.Modal.getInstance(document.getElementById('invitarAmigosModal')).hide();
        }
    } catch (error) {
        console.error('Error invitando:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo enviar la invitación'
        });
    }
};

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
                container.innerHTML = data.comentarios.map(c => {
                    const esAutor = usuarioActual && (
                        usuarioActual.id === c.usuario_id || 
                        usuarioActual.id == c.usuario_id ||
                        String(usuarioActual.id) === String(c.usuario_id)
                    );
                    console.log('Comparando:', { usuarioId: usuarioActual?.id, autorId: c.usuario_id, esAutor });
                    return `
                        <div class="d-flex mb-3 comentario-item" data-comentario-id="${c.id}">
                            <div class="avatar-circle me-2" style="width: 40px; height: 40px; font-size: 1rem;">
                                ${getIniciales(c.autor_nombre)}
                            </div>
                            <div class="flex-grow-1">
                                <div class="d-flex justify-content-between align-items-start">
                                    <div>
                                        <strong>${c.autor_nombre}</strong>
                                        <small class="text-muted ms-2">${formatearFecha(c.created_at)}</small>
                                    </div>
                                    ${esAutor ? `
                                        <div class="btn-group btn-group-sm" role="group">
                                            <button type="button" class="btn btn-outline-primary btn-sm" onclick="editarComentario(${c.id}, '${c.contenido.replace(/'/g, "\\'")}', ${proyectoId})">
                                                <i class="fas fa-edit"></i>
                                            </button>
                                            <button type="button" class="btn btn-outline-danger btn-sm" onclick="eliminarComentario(${c.id}, ${proyectoId})">
                                                <i class="fas fa-trash"></i>
                                            </button>
                                        </div>
                                    ` : ''}
                                </div>
                                <p class="mb-0 mt-2" id="contenido-${c.id}">${c.contenido}</p>
                            </div>
                        </div>
                    `;
                }).join('');
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

// Función para editar comentario
window.editarComentario = function(comentarioId, contenidoActual, proyectoId) {
    comentarioEnEdicion = comentarioId;
    proyectoEnEdicion = proyectoId;
    
    // Llenar el textarea con el contenido actual
    document.getElementById('editarComentarioTexto').value = contenidoActual;
    
    // Mostrar el modal
    const modal = new bootstrap.Modal(document.getElementById('editarComentarioModal'));
    modal.show();
};

// Función para eliminar comentario
window.eliminarComentario = async function(comentarioId, proyectoId) {
    const { isConfirmed } = await Swal.fire({
        title: '¿Eliminar comentario?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d'
    });
    
    if (!isConfirmed) return;
    
    try {
        const response = await fetch(`${API_URL}/comentarios/${comentarioId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: 'Comentario eliminado',
                timer: 1500
            });
            cargarComentarios(proyectoId);
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudo eliminar el comentario'
            });
        }
    } catch (error) {
        console.error('Error eliminando comentario:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo eliminar el comentario'
        });
    }
};

// Función para guardar comentario editado
document.getElementById('guardarComentarioBtn')?.addEventListener('click', async () => {
    const textarea = document.getElementById('editarComentarioTexto');
    const nuevoContenido = textarea.value.trim();
    
    if (!nuevoContenido) {
        Swal.fire({
            icon: 'warning',
            title: 'Campo vacío',
            text: 'El comentario no puede estar vacío'
        });
        return;
    }
    
    if (!comentarioEnEdicion || !proyectoEnEdicion) return;
    
    const btn = document.getElementById('guardarComentarioBtn');
    btn.disabled = true;
    
    try {
        const response = await fetch(`${API_URL}/comentarios/${comentarioEnEdicion}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                contenido: nuevoContenido
            })
        });
        
        const data = await response.json();
        
        if (data.success) {
            // Cerrar el modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('editarComentarioModal'));
            modal.hide();
            
            Swal.fire({
                icon: 'success',
                title: 'Comentario actualizado',
                timer: 1500
            });
            
            cargarComentarios(proyectoEnEdicion);
            comentarioEnEdicion = null;
            proyectoEnEdicion = null;
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: data.message || 'No se pudo actualizar el comentario'
            });
        }
    } catch (error) {
        console.error('Error editando comentario:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo editar el comentario'
        });
    } finally {
        btn.disabled = false;
    }
});

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

    // Obtener el ID del usuario actual del localStorage
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const usuarioId = user.id;

    feedContainer.innerHTML = proyectos.map(proyecto => {
        const tituloEscapado = proyecto.titulo.replace(/'/g, "\\'");
        // Verificar si el usuario actual es el creador
        const esCreador = proyecto.autor.id === usuarioId;
        
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
                    <i class="far fa-heart"></i> ${proyecto.likes}
                </span>
                <span class="stat-item" onclick="abrirComentarios(${proyecto.id}, '${tituloEscapado}')" style="cursor: pointer;">
                    <i class="far fa-comment"></i> ${proyecto.comentarios}
                </span>
            </div>
            
            <!-- Botones de acción -->
            <div class="d-flex justify-content-between align-items-center mt-3">
                <button class="btn-join" onclick="unirseAProyecto(${proyecto.id}, '${tituloEscapado}')">
                    <i class="fas fa-user-plus me-1"></i>Unirse
                </button>
                
                ${esCreador ? `
                <button class="btn-invite" onclick="mostrarAmigosParaInvitar(${proyecto.id}, '${tituloEscapado}')">
                    <i class="fas fa-user-friends me-1"></i>Invitar
                </button>
                ` : ''}
            </div>
        </div>
    `}).join('');
}

// Unirse a proyecto - VERSIÓN REAL
window.unirseAProyecto = async function(proyectoId, proyectoNombre) {
    try {
        const boton = document.querySelector(`[data-proyecto-id="${proyectoId}"] .btn-join`);
        if (boton) {
            boton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Uniendo...';
            boton.disabled = true;
        }
        
        const response = await fetch(`${API_URL}/proyectos/${proyectoId}/unirse`, {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        
        if (data.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Te has unido!',
                text: `Ahora eres parte del proyecto: ${proyectoNombre}`,
                timer: 2000,
                showConfirmButton: false
            });
            
            // Cambiar estado del botón
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
            if (boton) {
                boton.innerHTML = '<i class="fas fa-user-plus me-1"></i>Unirse';
                boton.disabled = false;
            }
        }
    } catch (error) {
        console.error('Error al unirse:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'Error de conexión'
        });
        
        const boton = document.querySelector(`[data-proyecto-id="${proyectoId}"] .btn-join`);
        if (boton) {
            boton.innerHTML = '<i class="fas fa-user-plus me-1"></i>Unirse';
            boton.disabled = false;
        }
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