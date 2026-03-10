// frontend/js/feed.js
const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) {
    window.location.href = 'login.html';
}

// Marcar el ícono activo
document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.nav-icon').forEach(icon => {
        icon.addEventListener('click', (e) => {
            document.querySelectorAll('.nav-icon').forEach(i => i.classList.remove('active'));
            e.currentTarget.classList.add('active');
        });
    });
});

// Elementos del DOM
const feedContainer = document.querySelector('.feed-container');

// Función para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: tipo,
            title: tipo === 'success' ? '¡Éxito!' : 'Error',
            text: mensaje,
            timer: 2000,
            showConfirmButton: false
        });
    } else {
        alert(mensaje);
    }
}

// Función para unirse a un proyecto
function unirseAProyecto(proyectoId, proyectoNombre) {
    // Aquí puedes agregar la lógica para unirse al proyecto
    // Por ahora solo mostramos un mensaje
    mostrarAlerta('success', `Te has unido al proyecto: ${proyectoNombre}`);
    
    // Opcional: Cambiar el estado del botón
    const boton = document.querySelector(`[data-proyecto-id="${proyectoId}"] .btn-join`);
    if (boton) {
        boton.textContent = '✓ Unido';
        boton.style.background = '#9ED9CC';
        boton.disabled = true;
    }
}

// Función para obtener iniciales
function getIniciales(nombre) {
    return nombre.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
}

// Función para mostrar proyectos
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

    feedContainer.innerHTML = proyectos.map(proyecto => `
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
                <span class="stat-item">
                    <i class="far fa-heart"></i> ${proyecto.likes}
                </span>
                <span class="stat-item">
                    <i class="far fa-comment"></i> ${proyecto.comentarios}
                </span>
            </div>

            <!-- Botón de unirse al proyecto -->
            <div class="text-end mt-3">
                <button class="btn-join" onclick="unirseAProyecto(${proyecto.id}, '${proyecto.titulo.replace(/'/g, "\\'")}')">
                    <i class="fas fa-user-plus me-1"></i>Unirse al proyecto
                </button>
            </div>
        </div>
    `).join('');

    // Hacer la función global para que pueda ser llamada desde el onclick
    window.unirseAProyecto = unirseAProyecto;
}

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
                // Limpiar localStorage
                localStorage.removeItem('token');
                localStorage.removeItem('user');
                localStorage.removeItem('justRegistered');
                
                // Redirigir al login
                window.location.href = 'login.html';
            }
        });
});

// Inicializar
document.addEventListener('DOMContentLoaded', cargarFeed);