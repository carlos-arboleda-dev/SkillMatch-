const API_URL = 'http://localhost:3000/api';
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
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

// Función para ir a editar perfil
window.editarPerfil = function() {
    window.location.href = 'editar-perfil.html';
};

// Cargar al iniciar
document.addEventListener('DOMContentLoaded', cargarPerfil);