// frontend/js/login.js


// Elementos del DOM
const loginForm = document.getElementById('loginForm');
const btnLogin = document.getElementById('btnLogin');
const btnText = document.querySelector('.btn-text');
const spinner = btnLogin.querySelector('.spinner-border');
const togglePassword = document.getElementById('togglePassword');
const passwordInput = document.getElementById('password');

// Función para mostrar/ocultar contraseña
togglePassword.addEventListener('click', function() {
    const type = passwordInput.getAttribute('type') === 'password' ? 'text' : 'password';
    passwordInput.setAttribute('type', type);
    this.querySelector('i').classList.toggle('fa-eye');
    this.querySelector('i').classList.toggle('fa-eye-slash');
});

// Función para mostrar alertas
function mostrarAlerta(tipo, mensaje) {
    Swal.fire({
        icon: tipo,
        title: tipo === 'success' ? '¡Bienvenido!' : 'Error',
        text: mensaje,
        timer: tipo === 'success' ? 1500 : undefined,
        showConfirmButton: tipo === 'error',
        background: 'white',
        iconColor: tipo === 'success' ? '#9ED9CC' : '#dc3545',
        confirmButtonColor: '#9ED9CC'
    });
}

// Función para cambiar estado de carga
function setLoading(loading) {
    btnLogin.disabled = loading;
    if (loading) {
        btnText.classList.add('d-none');
        spinner.classList.remove('d-none');
    } else {
        btnText.classList.remove('d-none');
        spinner.classList.add('d-none');
    }
}

// Manejar el envío del formulario
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    const email = document.getElementById('email').value.trim();
    const password = document.getElementById('password').value;

    // Validación básica
    if (!email || !password) {
        mostrarAlerta('error', 'Por favor completa todos los campos');
        return;
    }

    setLoading(true);

    // frontend/js/login.js

// ... (todo el código anterior igual, pero reemplaza la parte del try)

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ 
                email: email,  // Puede ser email o código estudiantil
                password: password 
            })
        });

        const data = await response.json();

        if (response.ok) {
        // Guardar token en localStorage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        console.log('Usuario logueado:', data.user); // 👈 VERIFICAR EN CONSOLA
        console.log('Rol del usuario:', data.user.rol); // 👈 VERIFICAR EN CONSOLA
        
        mostrarAlerta('success', 'Iniciando sesión...');
        
        /* --- VERIFICAR SI VIENE DEL REGISTRO --- */
        const justRegistered = localStorage.getItem('justRegistered');
        
        setTimeout(() => {
            if (justRegistered === 'true') {
                // Caso 1: Usuario recién registrado → va a completar perfil
                localStorage.removeItem('justRegistered');
                window.location.href = 'perfilacademico.html';
            } 
            else if (data.user.rol === 'admin') { // 👈 ESTA ES LA CONDICIÓN CLAVE
                // Caso 2: Es administrador → va al panel admin
                console.log('Redirigiendo a admin.html');
                window.location.href = 'admin.html';
            } 
            else {
                // Caso 3: Usuario normal → va al dashboard
                window.location.href = 'dashboard.html';
            }
        }, 1500);
    }

    } catch (error) {
        console.error('Error:', error);
        mostrarAlerta('error', 'Error de conexión con el servidor');
        setLoading(false);
    }

    
});

// Verificar si ya hay sesión activa
document.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Opcional: redirigir si ya está logueado
        // window.location.href = 'dashboard.html';
    }
});