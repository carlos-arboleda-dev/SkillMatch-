// frontend/js/perfilacademico.js

// Código añadido para manejar el botón "omitir" y redirección al login
/* --- ADDED START --- */
document.addEventListener('DOMContentLoaded', () => {
    const btnOmitir = document.getElementById('botonomitir');
    if (btnOmitir) {
        btnOmitir.addEventListener('click', (e) => {
            e.preventDefault(); // evitar que el formulario se envíe
            // Al omitir, volvemos al login
            window.location.href = 'login.html';
        });
    }
});
/* --- ADDED END --- */
