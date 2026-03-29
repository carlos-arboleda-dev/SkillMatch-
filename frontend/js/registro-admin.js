

document.getElementById('registerAdminForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    const btnRegistro = document.getElementById('btnRegistro');
    btnRegistro.disabled = true;
    btnRegistro.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Registrando...';

    const datos = {
        nombre: document.getElementById('nombre').value.trim(),
        email: document.getElementById('email').value.trim(),
        codigo: document.getElementById('codigo').value.trim() || null,
        password: document.getElementById('password').value,
        rol: 'admin', // Forzamos rol admin
        // Valores por defecto para campos de estudiante
        programa: 'Administración',
        semestre: 1
    };

    try {
        const response = await fetch(`${API_URL}/auth/register-admin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(datos)
        });

        const data = await response.json();

        if (response.ok) {
            Swal.fire({
                icon: 'success',
                title: '¡Admin registrado!',
                text: 'El administrador ha sido creado exitosamente',
                timer: 2000
            });
            setTimeout(() => window.location.href = 'login.html', 2000);
        } else {
            Swal.fire('Error', data.error || 'Error en el registro', 'error');
            btnRegistro.disabled = false;
            btnRegistro.innerHTML = 'Registrar Administrador';
        }
    } catch (error) {
        console.error('Error:', error);
        Swal.fire('Error', 'Error de conexión', 'error');
        btnRegistro.disabled = false;
        btnRegistro.innerHTML = 'Registrar Administrador';
    }
});