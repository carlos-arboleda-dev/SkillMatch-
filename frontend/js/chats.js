const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'login.html';

let currentChat = null;
let chats = [];

// Cargar lista de chats
async function cargarChats() {
    try {
        // Obtener amigos
        const amigosResponse = await fetch(`${API_URL}/amigos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const amigosData = await amigosResponse.json();
        const amigos = amigosData.success ? amigosData.amigos : [];

        // Obtener proyectos del usuario
        const proyectosResponse = await fetch(`${API_URL}/proyectos/mis-proyectos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const proyectosData = proyectosResponse.json();
        
        chats = [];

        // Agregar amigos a la lista de chats
        if (amigos && amigos.length > 0) {
            amigos.forEach(amigo => {
                chats.push({
                    id: `amigo-${amigo.id}`,
                    nombre: amigo.nombre,
                    codigo: amigo.codigo,
                    tipo: 'amigo',
                    usuarioId: amigo.id,
                    iniciales: obtenerIniciales(amigo.nombre)
                });
            });
        }

        // Agregar proyectos a la lista de chats
        try {
            const proyectosDataResolved = await proyectosData;
            if (proyectosDataResolved.success && proyectosDataResolved.proyectos) {
                proyectosDataResolved.proyectos.forEach(proyecto => {
                    chats.push({
                        id: `proyecto-${proyecto.id}`,
                        nombre: proyecto.nombre,
                        tipo: 'proyecto',
                        proyectoId: proyecto.id,
                        iniciales: obtenerIniciales(proyecto.nombre)
                    });
                });
            }
        } catch (error) {
            console.error('Error cargando proyectos:', error);
        }

        renderizarChats();
        actualizarBadgeNotificaciones();
    } catch (error) {
        console.error('Error cargando chats:', error);
    }
}

// Obtener iniciales de un nombre
function obtenerIniciales(nombre) {
    if (!nombre) return '?';
    return nombre.split(' ').map(word => word[0].toUpperCase()).slice(0, 2).join('');
}

// Renderizar lista de chats
function renderizarChats() {
    const chatsList = document.getElementById('chatsList');
    
    if (chats.length === 0) {
        chatsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #6c757d;"><p>No hay chats disponibles</p></div>';
        return;
    }

    chatsList.innerHTML = chats.map(chat => `
        <div class="chat-item ${currentChat?.id === chat.id ? 'active' : ''}" onclick="seleccionarChat('${chat.id}')">
            <div class="chat-avatar">${chat.iniciales}</div>
            <div class="chat-info">
                <div class="chat-name">${chat.nombre}</div>
                <div class="chat-context">
                    ${chat.tipo === 'amigo' ? (chat.codigo ? `(${chat.codigo})` : 'Amigo') : 'Proyecto'}
                </div>
            </div>
        </div>
    `).join('');
}

// Seleccionar un chat
async function seleccionarChat(chatId) {
    currentChat = chats.find(c => c.id === chatId);
    renderizarChats();
    cargarMensajesChat();
}

// Cargar mensajes del chat (placeholder)
function cargarMensajesChat() {
    const chatWindow = document.getElementById('chatWindow');
    
    if (!currentChat) return;

    chatWindow.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-info">
                <h5>${currentChat.nombre}</h5>
                <p>${currentChat.tipo === 'amigo' ? 'Conversación privada' : 'Chat del proyecto'}</p>
            </div>
        </div>
        <div class="messages-container" id="messagesContainer">
            <div class="empty-state">
                <i class="fas fa-comment-dots"></i>
                <p>No hay mensajes aún</p>
                <p style="font-size: 0.9rem;">Sé el primero en escribir</p>
            </div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="messageInput" placeholder="Enviar mensaje..." class="form-control">
            <button class="send-btn" onclick="enviarMensaje()">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;

    // Permitir enviar con Enter
    document.getElementById('messageInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            enviarMensaje();
        }
    });
}

// Enviar mensaje (placeholder)
async function enviarMensaje() {
    const input = document.getElementById('messageInput');
    const mensaje = input?.value.trim();

    if (!mensaje || !currentChat) return;

    try {
        // Aquí irá la lógica para enviar el mensaje a través de la API
        // Por ahora solo mostramos un placeholder
        input.value = '';
        
        Swal.fire({
            icon: 'info',
            title: 'Mensaje enviado',
            text: 'La funcionalidad de mensajes se implementará en la siguiente fase',
            timer: 2000
        });
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        Swal.fire({
            icon: 'error',
            title: 'Error',
            text: 'No se pudo enviar el mensaje'
        });
    }
}

// Actualizar badge de notificaciones
async function actualizarBadgeNotificaciones() {
    try {
        const response = await fetch(`${API_URL}/notificaciones/contar`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        const badge = document.getElementById('notificacionesBadge');
        if (badge) {
            if (data.noLeidas > 0) {
                badge.textContent = data.noLeidas;
                badge.style.display = 'inline';
            } else {
                badge.style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error actualizando badge:', error);
    }
}

// Manejar cierre de sesión
document.getElementById('cerrarSesion')?.addEventListener('click', function(e) {
    e.preventDefault();
    
    Swal.fire({
        title: '¿Cerrar sesión?',
        text: '¿Estás seguro que deseas salir?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#9ED9CC',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Sí, cerrar sesión',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            localStorage.removeItem('justRegistered');
            window.location.href = 'login.html';
        }
    });
});

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarChats();
    actualizarBadgeNotificaciones();
});
