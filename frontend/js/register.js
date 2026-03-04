// frontend/js/register.js

// URL base de la API (ajusta según tu configuración)
const API_URL = 'http://localhost:3000/api';

// Elementos del DOM
const registerForm = document.getElementById('registerForm');
const btnRegistro = document.getElementById('btnRegistro');

// Datos de facultades y carreras (basado en info de UDENAR)
const carrerasPorFacultad = {
    ingenieria: [
        "Ingeniería de Sistemas",
        "Ingeniería Electrónica",
        "Ingeniería Civil",
        "Ingeniería Agroindustrial",
        "Ingeniería Ambiental"
    ],
    agricolas: [
        "Ingeniería Agronómica",
        "Ingeniería Agroforestal"
    ],
    exactas: [
        "Biología",
        "Química",
        "Física",
        "Matemáticas",
        "Licenciatura en Ciencias Naturales"
    ],
    humanas: [
        "Psicología",
        "Sociología",
        "Filosofía",
        "Trabajo Social"
    ],
    economicas: [
        "Administración de Empresas",
        "Economía",
        "Contaduría Pública",
        "Comercio Internacional"
    ],
    derecho: [
        "Derecho"
    ],
    artes: [
        "Artes Visuales",
        "Música",
        "Diseño Gráfico"
    ],
    educacion: [
        "Licenciatura en Educación Básica",
        "Licenciatura en Lengua Castellana",
        "Licenciatura en Inglés",
        "Licenciatura en Matemáticas",
        "Licenciatura en Ciencias Sociales"
    ],
    salud: [
        "Medicina",
        "Enfermería"
    ],
    pecuarias: [
        "Medicina Veterinaria",
        "Zootecnia"
    ],
    posgrados: [
        "Especializaciones",
        "Maestrías",
        "Doctorados"
    ]
};

// Función para generar opciones de fecha
function generarOpcionesFecha() {
    const diaSelect = document.getElementById('dia');
    const mesSelect = document.getElementById('mes');
    const anioSelect = document.getElementById('anio');

    if (!diaSelect || !mesSelect || !anioSelect) {
        console.error('No se encontraron los selects de fecha');
        return;
    }

    // Días (1-31)
    for (let i = 1; i <= 31; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        diaSelect.appendChild(option);
    }

    // Meses
    const meses = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 
                   'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
    meses.forEach((mes, index) => {
        const option = document.createElement('option');
        option.value = index + 1;
        option.textContent = mes;
        mesSelect.appendChild(option);
    });

    // Años (desde 1980 hasta 2010)
    const anioActual = new Date().getFullYear();
    for (let i = anioActual - 25; i <= anioActual - 15; i++) {
        const option = document.createElement('option');
        option.value = i;
        option.textContent = i;
        anioSelect.appendChild(option);
    }
}

// Función para actualizar el select de programas según facultad seleccionada
function actualizarProgramas() {
    const facultadSelect = document.getElementById('facultad');
    const programaSelect = document.getElementById('programa');
    
    if (!facultadSelect || !programaSelect) {
        console.error('No se encontraron los selects de facultad o programa');
        return;
    }
    
    const facultadSeleccionada = facultadSelect.value;

    // Limpiar opciones actuales
    programaSelect.innerHTML = '<option value="">Selecciona un programa</option>';

    if (facultadSeleccionada && carrerasPorFacultad[facultadSeleccionada]) {
        // Habilitar select y agregar opciones
        programaSelect.disabled = false;
        
        carrerasPorFacultad[facultadSeleccionada].forEach(carrera => {
            const option = document.createElement('option');
            option.value = carrera;
            option.textContent = carrera;
            programaSelect.appendChild(option);
        });
    } else {
        // Deshabilitar si no hay facultad seleccionada
        programaSelect.disabled = true;
    }
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
        iconColor: tipo === 'success' ? '#667eea' : '#dc3545'
    });
}

// Función para validar el formulario
function validarFormulario(datos) {
    // Validar que las contraseñas coincidan
    if (datos.password !== datos.confirmPassword) {
        mostrarAlerta('error', 'Las contraseñas no coinciden');
        return false;
    }

    // Validar correo institucional
    if (!datos.email.endsWith('@udenar.edu.co')) {
        mostrarAlerta('error', 'Debes usar tu correo institucional (@udenar.edu.co)');
        return false;
    }

    // Validar código estudiantil (ejemplo: 10 dígitos)
    if (!/^\d{10}$/.test(datos.codigo)) {
        mostrarAlerta('error', 'El código estudiantil debe tener 10 dígitos');
        return false;
    }

    // Validar que se haya seleccionado fecha de nacimiento
    if (!datos.dia || !datos.mes || !datos.anio) {
        mostrarAlerta('error', 'Por favor selecciona tu fecha de nacimiento completa');
        return false;
    }

    return true;
}

// Inicializar todo cuando el DOM esté cargado
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM cargado, inicializando formulario...');
    
    // Inicializar selects de fecha
    generarOpcionesFecha();
    
    // Inicializar select de programa (deshabilitado por defecto)
    const programaSelect = document.getElementById('programa');
    if (programaSelect) {
        programaSelect.disabled = true;
    }
    
    // Agregar event listener al select de facultad
    const facultadSelect = document.getElementById('facultad');
    if (facultadSelect) {
        facultadSelect.addEventListener('change', actualizarProgramas);
    } else {
        console.error('No se encontró el elemento con id "facultad"');
    }
    
    // Manejar el envío del formulario
    if (registerForm) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();

            // Mostrar estado de carga
            btnRegistro.disabled = true;
            btnRegistro.innerHTML = '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Registrando...';

            try {
                // Recopilar datos del formulario
                const datos = {
                    nombre: document.getElementById('nombre').value.trim(),
                    apellido: document.getElementById('apellido').value.trim(),
                    email: document.getElementById('email').value.trim(),
                    codigo: document.getElementById('codigo').value.trim(),
                    programa: document.getElementById('programa').value.trim(),
                    semestre: parseInt(document.getElementById('semestre').value),
                    password: document.getElementById('password').value,
                    confirmPassword: document.getElementById('confirmPassword').value,
                    dia: document.getElementById('dia').value,
                    mes: document.getElementById('mes').value,
                    anio: document.getElementById('anio').value,
                    genero: document.getElementById('genero').value,
                    universidad: document.getElementById('universidad').value
                };

                // Validar datos
                if (!validarFormulario(datos)) {
                    btnRegistro.disabled = false;
                    btnRegistro.innerHTML = 'Registrarse';
                    return;
                }

                // Enviar petición al backend
                const response = await fetch(`${API_URL}/auth/register`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        nombre: datos.nombre,
                        apellido: datos.apellido,
                        email: datos.email,
                        codigo: datos.codigo,
                        programa: datos.programa,
                        semestre: datos.semestre,
                        password: datos.password
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Registro exitoso
                    mostrarAlerta('success', '¡Registro exitoso! Redirigiendo al login...');
                    
                    // Guardar datos adicionales
                    localStorage.setItem('datosRegistro', JSON.stringify({
                        fecha_nacimiento: `${datos.anio}-${datos.mes}-${datos.dia}`,
                        genero: datos.genero,
                        universidad: datos.universidad
                    }));

                    // Marcar que el usuario acaba de registrarse
                    localStorage.setItem('justRegistered', 'true');
                    localStorage.setItem('registeredEmail', datos.email);

                    // Redirigir al login después de 2 segundos
                    setTimeout(() => {
                        window.location.href = 'login.html';
                    }, 2000);
                } else {
                    // Error en el registro
                    mostrarAlerta('error', data.error || 'Error en el registro');
                    btnRegistro.disabled = false;
                    btnRegistro.innerHTML = 'Registrarse';
                }
            } catch (error) {
                console.error('Error:', error);
                mostrarAlerta('error', 'Error de conexión con el servidor');
                btnRegistro.disabled = false;
                btnRegistro.innerHTML = 'Registrarse';
            }
        });
    } else {
        console.error('No se encontró el formulario con id "registerForm"');
    }
});