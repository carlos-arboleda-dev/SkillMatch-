// frontend/js/admin.js
const API_URL = 'http://localhost:3000/api';

// Verificar autenticación y rol
const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'login.html';
}

// Mostrar nombre del admin
document.getElementById('adminName').textContent = `Hola, ${user.nombre || 'Admin'}`;

// Función para hacer peticiones autenticadas
async function fetchWithAuth(url, options = {}) {
    const response = await fetch(url, {
        ...options,
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            ...options.headers
        }
    });
    
    if (response.status === 401 || response.status === 403) {
        localStorage.clear();
        window.location.href = 'login.html';
        return null;
    }
    
    return response;
}

// Cargar estadísticas
async function cargarEstadisticas() {
    try {
        const response = await fetchWithAuth(`${API_URL}/admin/estadisticas`);
        if (!response) return;
        
        const data = await response.json();
        document.getElementById('totalUsuarios').textContent = data.totalUsuarios;
        document.getElementById('totalEstudiantes').textContent = data.estudiantes;
        document.getElementById('totalAdmins').textContent = data.admins;
    } catch (error) {
        console.error('Error cargando estadísticas:', error);
    }
}

// Cargar usuarios
async function cargarUsuarios() {
    try {
        const response = await fetchWithAuth(`${API_URL}/admin/usuarios`);
        if (!response) return;
        
        const usuarios = await response.json();
        const tbody = document.getElementById('tablaUsuarios');
        
        if (usuarios.length === 0) {
            tbody.innerHTML = '<tr><td colspan="7" class="text-center">No hay usuarios registrados</td></tr>';
            return;
        }
        
        tbody.innerHTML = usuarios.map(u => `
            <tr>
                <td>${u.id}</td>
                <td>${u.nombre_completo}</td>
                <td>${u.correo_institucional}</td>
                <td>${u.codigo_estudiantil}</td>
                <td>${u.programa_academico}</td>
                <td>
                    <span class="badge ${u.rol === 'admin' ? 'bg-success' : 'bg-primary'}">
                        ${u.rol}
                    </span>
                </td>
                <td>
                    <button class="btn btn-sm btn-admin" onclick="cambiarRol(${u.id}, '${u.rol}')">
                        <i class="fas fa-user-tag"></i>
                    </button>
                    <button class="btn btn-sm btn-danger" onclick="eliminarUsuario(${u.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>
        `).join('');
    } catch (error) {
        console.error('Error cargando usuarios:', error);
    }
}

// Cambiar rol de usuario
async function cambiarRol(userId, rolActual) {
    const nuevoRol = rolActual === 'admin' ? 'estudiante' : 'admin';
    
    const confirm = await Swal.fire({
        title: '¿Cambiar rol?',
        text: `¿Seguro que quieres cambiar a ${nuevoRol}?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#9ED9CC',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cambiar'
    });
    
    if (!confirm.isConfirmed) return;
    
    try {
        const response = await fetchWithAuth(`${API_URL}/admin/usuarios/${userId}/rol`, {
            method: 'PUT',
            body: JSON.stringify({ rol: nuevoRol })
        });
        
        if (response && response.ok) {
            Swal.fire('¡Actualizado!', 'Rol cambiado correctamente', 'success');
            cargarUsuarios();
        }
    } catch (error) {
        console.error('Error cambiando rol:', error);
    }
}

// Eliminar usuario
async function eliminarUsuario(userId) {
    const confirm = await Swal.fire({
        title: '¿Eliminar usuario?',
        text: 'Esta acción no se puede deshacer',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#9ED9CC',
        confirmButtonText: 'Sí, eliminar'
    });
    
    if (!confirm.isConfirmed) return;
    
    // Aquí implementarías la eliminación
    Swal.fire('Función en desarrollo', 'Próximamente disponible', 'info');
}

// Cerrar sesión
document.getElementById('btnLogout').addEventListener('click', () => {
    localStorage.clear();
    window.location.href = 'login.html';
});

// Cargar datos al iniciar
cargarEstadisticas();
cargarUsuarios();