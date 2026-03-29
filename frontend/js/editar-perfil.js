// frontend/js/editar-perfil.js


const token = localStorage.getItem('token');
const user = JSON.parse(localStorage.getItem('user') || '{}');

if (!token) {
    window.location.href = 'login.html';
}

// Función para convertir imagen a Base64 (DEFINIDA PRIMERO)
function convertirImagenABase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// Función para obtener valores seleccionados
function getSelectedValues(selectId) {
    const select = document.getElementById(selectId);
    if (!select) return [];
    return Array.from(select.selectedOptions).map(opt => opt.value);
}

// Mostrar alertas
function mostrarAlerta(tipo, mensaje) {
    if (typeof Swal !== 'undefined') {
        Swal.fire({
            icon: tipo,
            title: tipo === 'success' ? '¡Éxito!' : 'Error',
            text: mensaje,
            timer: tipo === 'success' ? 1500 : undefined,
            showConfirmButton: tipo === 'error'
        });
    } else {
        alert(mensaje);
    }
}

// Cargar datos del perfil
async function cargarPerfil() {
    try {
        document.getElementById('nombre').value = user.nombre || '';
        document.getElementById('carrera').value = user.programa || 'Ingeniería de Sistemas';
        document.getElementById('correo').value = user.email || '';
        
        const response = await fetch(`${API_URL}/perfil/obtener`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (!response.ok) {
            throw new Error('Error al cargar perfil');
        }
        
        const data = await response.json();
        
        if (data.success && data.perfil) {
            const perfil = data.perfil;
            
            document.getElementById('semestre').value = perfil.semestre || '';
            document.getElementById('ciudad').value = perfil.ciudad || '';
            document.getElementById('telefono').value = perfil.telefono || '';
            document.getElementById('correoRecuperacion').value = perfil.correo_recuperacion || '';
            document.getElementById('telefonoRecuperacion').value = perfil.telefono_recuperacion || '';
            document.getElementById('rol_preferido').value = perfil.rol_preferido || '';
            
            // Mostrar foto si existe
            if (perfil.foto_perfil) {
                const fotoPerfil = document.getElementById('fotoPerfil');
                if (fotoPerfil) {
                    fotoPerfil.src = perfil.foto_perfil;
                }
            }
            
            // Seleccionar opciones múltiples
            ['intereses', 'habilidades', 'tipo_proyecto', 'temas_gustan'].forEach(id => {
                const select = document.getElementById(id);
                if (select && perfil[id]) {
                    Array.from(select.options).forEach(opt => {
                        opt.selected = perfil[id].includes(opt.value);
                    });
                }
            });
        }
    } catch (error) {
        console.error('Error cargando perfil:', error);
    }
}

// Guardar cambios
document.getElementById('editarPerfilForm')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const btnSubmit = e.target.querySelector('button[type="submit"]');
    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<span class="spinner-border spinner-border-sm"></span> Guardando...';
    
    try {
        // Procesar la foto si se seleccionó una
        const fotoInput = document.getElementById('foto');
        let fotoBase64 = null;

        if (fotoInput.files.length > 0) {
            fotoBase64 = await convertirImagenABase64(fotoInput.files[0]);
            console.log('📸 Foto seleccionada, tamaño:', fotoBase64.length);
        }
        
        const datos = {
            semestre: parseInt(document.getElementById('semestre')?.value) || null,
            ciudad: document.getElementById('ciudad')?.value || '',
            telefono: document.getElementById('telefono')?.value || '',
            correoRecuperacion: document.getElementById('correoRecuperacion')?.value || '',
            telefonoRecuperacion: document.getElementById('telefonoRecuperacion')?.value || '',
            intereses: getSelectedValues('intereses'),
            habilidades: getSelectedValues('habilidades'),
            tipo_proyecto: getSelectedValues('tipo_proyecto'),
            temas_gustan: getSelectedValues('temas_gustan'),
            rol_preferido: document.getElementById('rol_preferido')?.value || '',
            foto: fotoBase64
        };
        
        console.log('📤 Enviando datos:', datos);
        
        const response = await fetch(`${API_URL}/perfil/actualizar`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(datos)
        });
        
        if (!response.ok) {
            const text = await response.text();
            console.error('❌ Respuesta no OK:', text);
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const result = await response.json();
        console.log('✅ Respuesta:', result);
        
        if (result.success) {
            mostrarAlerta('success', 'Perfil actualizado correctamente');
            setTimeout(() => {
                window.location.href = 'perfil.html';
            }, 1500);
        } else {
            mostrarAlerta('error', result.error || 'Error al guardar');
            btnSubmit.disabled = false;
            btnSubmit.innerHTML = 'Guardar cambios';
        }
    } catch (error) {
        console.error('❌ Error:', error);
        mostrarAlerta('error', 'Error de conexión con el servidor');
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = 'Guardar cambios';
    }
});

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', cargarPerfil);