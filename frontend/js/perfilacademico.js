// frontend/js/perfilacademico.js


// Obtener token del localStorage
const token = localStorage.getItem('token');

// Verificar autenticación
if (!token) {
    window.location.href = 'login.html';
}

// Función para obtener valores seleccionados de un select múltiple
function getSelectedValues(selectId) {
    const select = document.getElementById(selectId);
    return Array.from(select.selectedOptions).map(opt => opt.value);
}

// Función para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
    Swal.fire({
        icon: tipo,
        title: tipo === 'success' ? '¡Éxito!' : 'Error',
        text: mensaje,
        timer: tipo === 'success' ? 2000 : undefined,
        showConfirmButton: tipo === 'error',
        background: '#fff',
        iconColor: tipo === 'success' ? '#9ED9CC' : '#dc3545'
    });
}

// Manejar envío del formulario
document.getElementById('perfilForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Cambiar estado del botón
    const btnAceptar = document.getElementById('botonaceptar');
    btnAceptar.disabled = true;
    btnAceptar.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';

    try {
        // Recopilar datos
        const datos = {
            intereses: getSelectedValues('intereses'),
            habilidades: getSelectedValues('habilidades'),
            tipo_proyecto: getSelectedValues('tipos_proyecto'), // ¡Importante! esto va a tipo_proyecto
            temas_gustan: getSelectedValues('temas_aprender'),  // ¡Importante! esto va a temas_gustan
            rol_preferido: document.getElementById('rol_preferido').value
        };

        console.log('Datos a enviar:', datos); // Para verificar

        // Validar rol preferido
        if (!datos.rol_preferido) {
            mostrarAlerta('error', 'Por favor selecciona tu rol preferido');
            btnAceptar.disabled = false;
            btnAceptar.innerHTML = 'Guardar Perfil';
            return;
        }

        // Enviar al backend
        const response = await fetch(`${API_URL}/perfil/guardar`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });

        const data = await response.json();

        if (response.ok) {
            mostrarAlerta('success', 'Perfil guardado exitosamente');
            
            // Limpiar flag de registro reciente
            localStorage.removeItem('justRegistered');
            
            // Redirigir al dashboard después de 2 segundos
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 2000);
        } else {
            mostrarAlerta('error', data.error || 'Error al guardar perfil');
            btnAceptar.disabled = false;
            btnAceptar.innerHTML = 'Guardar Perfil';
        }
    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('error', 'Error de conexión con el servidor');
        btnAceptar.disabled = false;
        btnAceptar.innerHTML = 'Guardar Perfil';
    }
});

// Manejar botón omitir
document.getElementById('botonomitir').addEventListener('click', (e) => {
    e.preventDefault();
    
    Swal.fire({
        title: '¿Estás seguro?',
        text: 'Puedes completar tu perfil académico más tarde',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#9ED9CC',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, omitir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('justRegistered');
            window.location.href = 'dashboard.html';
        }
    });
});