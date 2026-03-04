const bcrypt = require('bcrypt');

async function generarHash() {
    const password = 'admin123'; // La contraseña que quieras
    const hash = await bcrypt.hash(password, 10);
    console.log('Hash generado:', hash);
}

generarHash();