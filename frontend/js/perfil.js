

const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) window.location.href = 'login.html';

// Cargar datos del perfil
async function cargarPerfil() {
    try {
        // Mostrar datos básicos del usuario
        document.getElementById('nombreUsuario').textContent = user.nombre || 'Usuario';
        document.getElementById('carrera').textContent = user.programa || 'Ingeniería de Sistemas';
        
        // Cargar perfil académico
        const response = await fetch(`${API_URL}/perfil/obtener`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        
        if (data.success && data.perfil) {
            const perfil = data.perfil;
            
            // 👇 MOSTRAR FOTO SI EXISTE
            if (perfil.foto_perfil) {
                const fotoPerfil = document.getElementById('fotoPerfil');
                if (fotoPerfil) {
                    fotoPerfil.src = perfil.foto_perfil;
                }
            }
            
            // Mostrar ciudad
            if (document.getElementById('ciudad')) {
                document.getElementById('ciudad').textContent = perfil.ciudad || 'Pasto';
            }
            
            // Mostrar intereses
            const interesesContainer = document.getElementById('interesesContainer');
            if (interesesContainer && perfil.intereses) {
                interesesContainer.innerHTML = perfil.intereses.map(i => 
                    `<span class="badge bg-success bg-opacity-25 text-dark p-2">${i}</span>`
                ).join('');
            }

            // Cargar proyectos
            await cargarProyectos();
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

// Función para cargar proyectos del usuario
async function cargarProyectos() {
    try {
        const response = await fetch(`${API_URL}/proyectos/mis-proyectos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const proyectos = await response.json();

        const proyectosContainer = document.getElementById('proyectosContainer');
        if (proyectosContainer) {
            if (proyectos.length === 0) {
                proyectosContainer.innerHTML = '<p class="text-muted">No tienes proyectos creados aún. <a href="crear_proyecto.html">Crear uno</a></p>';
            } else {
                proyectosContainer.innerHTML = proyectos.map(proyecto => `
                    <div class="card mb-3">
                        <div class="card-body">
                            <h6 class="card-title">${proyecto.nombre}</h6>
                            <p class="card-text">${proyecto.descripcion}</p>
                            <div class="row">
                                <div class="col-6">
                                    <small class="text-muted">Duración: ${proyecto.duracion}</small>
                                </div>
                                <div class="col-6">
                                    <small class="text-muted">Integrantes: ${proyecto.numero_integrantes}</small>
                                </div>
                            </div>
                            <small class="text-muted">Fecha inicio: ${new Date(proyecto.fecha_inicio).toLocaleDateString()}</small>
                        </div>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error cargando proyectos:', error);
        const proyectosContainer = document.getElementById('proyectosContainer');
        if (proyectosContainer) {
            proyectosContainer.innerHTML = '<p class="text-danger">Error cargando proyectos</p>';
        }
    }
}


// Cargar datos del perfil
async function cargarPerfil() {
    try {
        // Mostrar datos básicos del usuario
        document.getElementById('nombreUsuario').textContent = user.nombre || 'Usuario';
        document.getElementById('carrera').textContent = user.programa || 'Ingeniería de Sistemas';
        
        // Cargar perfil académico
        const response = await fetch(`${API_URL}/perfil/obtener`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        
        if (data.success && data.perfil) {
            const perfil = data.perfil;
            console.log('Perfil cargado:', perfil); // Para depurar
            
            // 👇 MOSTRAR FOTO SI EXISTE
            if (perfil.foto_perfil) {
                const fotoPerfil = document.getElementById('fotoPerfil');
                if (fotoPerfil) {
                    fotoPerfil.src = perfil.foto_perfil;
                }
            }
            
            // Mostrar ciudad
            if (document.getElementById('ciudad')) {
                document.getElementById('ciudad').textContent = perfil.ciudad || 'Pasto';
            }
            
            // 👇 MOSTRAR INTERESES (CORREGIDO: perfil.interes_academico)
            const interesesContainer = document.getElementById('interesesContainer');
            if (interesesContainer) {
                if (perfil.interes_academico && perfil.interes_academico.length > 0) {
                    interesesContainer.innerHTML = perfil.interes_academico.map(i => 
                        `<span class="badge bg-success bg-opacity-25 text-dark p-2">${i}</span>`
                    ).join('');
                } else {
                    interesesContainer.innerHTML = '<p class="text-muted">No has agregado intereses aún. <a href="editar-perfil.html">Agregar</a></p>';
                }
            }

            // Cargar proyectos
            await cargarProyectos();
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
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

// Función para ir a editar perfil
window.editarPerfil = function() {
    window.location.href = 'editar-perfil.html';
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

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', function() {
    cargarPerfil();
    actualizarBadgeNotificaciones();
});