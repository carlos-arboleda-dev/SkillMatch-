// frontend/js/login.js
const API_URL = 'http://localhost:3000/api';

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
const API_URL = 'http://localhost:3000/api';

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
            
            mostrarAlerta('success', 'Iniciando sesión...');
            
            setTimeout(() => {
                window.location.href = 'dashboard.html';
            }, 1500);
        } else {
            mostrarAlerta('error', data.error || 'Credenciales incorrectas');
            setLoading(false);
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