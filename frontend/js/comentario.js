// frontend/js/comentarios.js
let proyectoActualId = null;

// Abrir modal de comentarios
function abrirComentarios(proyectoId, proyectoTitulo) {
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
}

// Cargar comentarios
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

// Enviar comentario
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
            
            // Actualizar contador en el feed
            actualizarContadorComentarios(proyectoActualId);
        }
    } catch (error) {
        console.error('Error enviando comentario:', error);
    } finally {
        input.disabled = false;
    }
});

// Funciones auxiliares
function getIniciales(nombre) {
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

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

// Hacer función global
window.abrirComentarios = abrirComentarios;