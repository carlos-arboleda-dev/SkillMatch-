document.getElementById('registerForm').addEventListener('submit', async (e) => {
    e.preventDefault();

    // Obtener valores
    const nombre = document.getElementById('nombre').value;
    const apellido = document.getElementById('apellido').value;
    const email = document.getElementById('email').value;
    const codigo = document.getElementById('codigo').value;
    const programa = document.getElementById('programa').value;
    const semestre = document.getElementById('semestre').value;
    const password = document.getElementById('password').value;
    const confirmPassword = document.getElementById('confirmPassword').value;

    // Validación básica
    if (password !== confirmPassword) {
        alert('Las contraseñas no coinciden');
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ nombre, apellido, email, codigo, programa, semestre, password })
        });

        const data = await response.json();

        if (response.ok) {
            alert('Registro exitoso. Ahora inicia sesión.');
            window.location.href = 'login.html';
        } else {
            alert('Error: ' + data.error);
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error de conexión con el servidor');
    }
});