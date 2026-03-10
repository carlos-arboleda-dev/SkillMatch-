// JavaScript para la página de crear proyecto
const API_URL = 'http://localhost:3000/api';
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('crearProyectoForm');
    const cancelarBtn = document.getElementById('cancelar');
    const fechaInicioInput = document.getElementById('fechaInicio');

    // Establecer la fecha mínima como la fecha actual
    const today = new Date().toISOString().split('T')[0];
    fechaInicioInput.setAttribute('min', today);

    // Manejar el envío del formulario
    form.addEventListener('submit', async function(e) {
        e.preventDefault();

        // Obtener datos del formulario
        const formData = new FormData(form);
        const data = {
            nombre: formData.get('nombre'),
            descripcion: formData.get('descripcion'),
            duracion: formData.get('duracion'),
            fechaInicio: formData.get('fechaInicio'),
            integrantes: formData.get('integrantes')
        };

        // Obtener token de autenticación (asumiendo que está en localStorage)
        const token = localStorage.getItem('token');
        if (!token) {
            alert('Debes iniciar sesión para crear un proyecto');
            window.location.href = 'login.html';
            return;
        }

        try {
            const response = await fetch(`${API_URL}/proyectos/crear`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });

            if (response.ok) {
                const result = await response.json();
                    // mostrar modal de confirmación
                    const proyectoModal = new bootstrap.Modal(document.getElementById('proyectoModal'));
                    proyectoModal.show();

                    // configurar botón volver
                    document.getElementById('volverPerfilBtn').addEventListener('click', function() {
                        proyectoModal.hide();
                        window.location.href = 'perfil.html';
                    });
            } else {
                const error = await response.json();
                alert('Error creando proyecto: ' + error.message);
            }
        } catch (error) {
            console.error('Error:', error);
            alert('Error de conexión');
        }
    });

    // Manejar el botón cancelar
    cancelarBtn.addEventListener('click', function() {
        // Lógica para cancelar, por ejemplo, redirigir a otra página
        window.location.href = 'dashboard.html'; // O la página que corresponda
    });
});