const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'login.html';

let currentChat = null;
let chats = [];
const user = JSON.parse(localStorage.getItem('user') || '{}');
const miId = parseInt(user.id);

function obtenerIniciales(nombre) {
    if (!nombre) return '?';
    return nombre.split(' ').map(word => word[0].toUpperCase()).slice(0, 2).join('');
}

function generarChatId(idA, idB) {
    const a = parseInt(idA);
    const b = parseInt(idB);
    return `amigo-${Math.min(a, b)}-${Math.max(a, b)}`;
}

// USA EL ENDPOINT UNIFICADO - no dos llamadas separadas
async function cargarChats() {
    try {
        console.log('🔄 Cargando chats...');

        const response = await fetch(`${API_URL}/mensajes/chats`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const data = await response.json();
        console.log('Chats del servidor:', data);

        chats = [];

        if (data.success && data.chats) {
            data.chats.forEach(chat => {
                if (chat.tipo === 'amigo') {
                    // Reconstruir ID simétrico con el usuarioId del amigo
                    chats.push({
                        ...chat,
                        id: generarChatId(miId, chat.usuarioId)
                    });
                } else {
                    chats.push(chat); // proyectos ya vienen con id correcto
                }
            });
        }

        console.log('Chats procesados:', chats);
        renderizarChats();

    } catch (error) {
        console.error('Error cargando chats:', error);
    }

    actualizarBadgeNotificaciones();
}

function renderizarChats() {
    const chatsList = document.getElementById('chatsList');

    if (chats.length === 0) {
        chatsList.innerHTML = `
            <div style="padding: 2rem; text-align: center; color: #6c757d;">
                <p>No hay chats disponibles.<br>Agrega amigos o únete a proyectos.</p>
            </div>`;
        return;
    }

    // Separar amigos y proyectos para mostrarlos agrupados
    const amigos = chats.filter(c => c.tipo === 'amigo');
    const proyectos = chats.filter(c => c.tipo === 'proyecto');

    let html = '';

    if (proyectos.length > 0) {
        html += `<div class="chat-section-title" style="padding: 0.5rem 1rem; font-size: 0.75rem; color: #9ED9CC; font-weight: 600; text-transform: uppercase;">Grupos de Proyecto</div>`;
        html += proyectos.map(chat => renderChatItem(chat)).join('');
    }

    if (amigos.length > 0) {
        html += `<div class="chat-section-title" style="padding: 0.5rem 1rem; font-size: 0.75rem; color: #9ED9CC; font-weight: 600; text-transform: uppercase; margin-top: 0.5rem;">Amigos</div>`;
        html += amigos.map(chat => renderChatItem(chat)).join('');
    }

    chatsList.innerHTML = html;
}

function renderChatItem(chat) {
    const isActive = currentChat?.id === chat.id;
    const subtitulo = chat.tipo === 'proyecto'
        ? '👥 Grupo del proyecto'
        : (chat.codigo ? `(${chat.codigo})` : 'Amigo');

    return `
        <div class="chat-item ${isActive ? 'active' : ''}" onclick="seleccionarChat('${chat.id}')">
            <div class="chat-avatar" style="${chat.tipo === 'proyecto' ? 'background: #9ED9CC; color: #fff;' : ''}">
                ${chat.tipo === 'proyecto' ? '<i class="fas fa-users" style="font-size:0.9rem"></i>' : obtenerIniciales(chat.nombre)}
            </div>
            <div class="chat-info">
                <div class="chat-name">${chat.nombre}</div>
                <div class="chat-context">${subtitulo}</div>
            </div>
        </div>
    `;
}

window.seleccionarChat = async function(chatId) {
    currentChat = chats.find(c => c.id === chatId);
    renderizarChats();
    await cargarMensajes();
};

async function cargarMensajes() {
    const chatWindow = document.getElementById('chatWindow');
    if (!currentChat) return;

    console.log('📂 Cargando mensajes para chat:', currentChat.id);

    chatWindow.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-info">
                <h5>${escapeHtml(currentChat.nombre)}</h5>
                <p>${currentChat.tipo === 'proyecto' ? '👥 Grupo del proyecto' : 'Conversación privada'}</p>
            </div>
        </div>
        <div class="messages-container" id="messagesContainer">
            <div class="text-center text-muted py-5">
                <i class="fas fa-spinner fa-spin fa-2x mb-3"></i>
                <p>Cargando mensajes...</p>
            </div>
        </div>
        <div class="chat-input-area">
            <input type="text" id="messageInput" placeholder="Escribe un mensaje..." class="form-control">
            <button class="send-btn" onclick="enviarMensaje()">
                <i class="fas fa-paper-plane"></i>
            </button>
        </div>
    `;

    document.getElementById('messageInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') enviarMensaje();
    });

    try {
        const response = await fetch(`${API_URL}/mensajes/${encodeURIComponent(currentChat.id)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });

        const data = await response.json();
        console.log('📥 Mensajes recibidos:', data);

        const container = document.getElementById('messagesContainer');

        if (!data.success) {
            container.innerHTML = `<div class="alert alert-danger">${data.error || 'Error al cargar mensajes'}</div>`;
            return;
        }

        if (!data.mensajes || data.mensajes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-comment-dots"></i>
                    <p>No hay mensajes aún</p>
                    <p style="font-size: 0.9rem;">¡Sé el primero en escribir!</p>
                </div>
            `;
        } else {
            container.innerHTML = data.mensajes.map(m => {
                const esMiMensaje = parseInt(m.usuario_id) === miId;
                return `
                    <div class="message ${esMiMensaje ? 'sent' : 'received'}">
                        <div class="message-bubble">
                            ${!esMiMensaje && currentChat.tipo === 'proyecto' ? `<div class="message-author">${m.autor_nombre}</div>` : ''}
                            ${escapeHtml(m.mensaje)}
                            <div class="message-time">
                                ${esMiMensaje ? 'Tú' : m.autor_nombre} • ${formatearFecha(m.created_at)}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');

            container.scrollTop = container.scrollHeight;
        }
    } catch (error) {
        console.error('Error cargando mensajes:', error);
        document.getElementById('messagesContainer').innerHTML = `
            <div class="alert alert-danger">Error al cargar mensajes</div>
        `;
    }
}

window.enviarMensaje = async function() {
    const input = document.getElementById('messageInput');
    const mensaje = input?.value.trim();
    if (!mensaje || !currentChat) return;

    const container = document.getElementById('messagesContainer');
    const tempId = Date.now();

    container.innerHTML += `
        <div class="message sent" data-temp="${tempId}">
            <div class="message-bubble">
                ${escapeHtml(mensaje)}
                <div class="message-time">Tú • Enviando...</div>
            </div>
        </div>
    `;
    input.value = '';
    container.scrollTop = container.scrollHeight;

    try {
        const response = await fetch(`${API_URL}/mensajes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ chat_id: currentChat.id, mensaje })
        });

        const data = await response.json();

        if (data.success) {
            await cargarMensajes();
        } else {
            document.querySelector(`[data-temp="${tempId}"]`)?.remove();
            Swal.fire('Error', data.error || 'No se pudo enviar el mensaje', 'error');
        }
    } catch (error) {
        console.error('Error enviando mensaje:', error);
        document.querySelector(`[data-temp="${tempId}"]`)?.remove();
        Swal.fire('Error', 'Error de conexión', 'error');
    }
};

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

function formatearFecha(fecha) {
    const d = new Date(fecha);
    const hoy = new Date();
    const diff = hoy - d;
    const minutos = Math.floor(diff / 60000);

    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (minutos < 1440) return `Hace ${Math.floor(minutos / 60)} h`;
    return `${d.getDate()}/${d.getMonth() + 1} ${d.getHours().toString().padStart(2, '0')}:${d.getMinutes().toString().padStart(2, '0')}`;
}

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
        console.error('Error badge:', error);
    }
}

document.getElementById('cerrarSesion')?.addEventListener('click', async function(e) {
    e.preventDefault();

    const result = await Swal.fire({
        title: '¿Cerrar sesión?',
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#9ED9CC',
        confirmButtonText: 'Sí, salir',
        cancelButtonText: 'Cancelar'
    });

    if (result.isConfirmed) {
        try {
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (e) {}
        localStorage.clear();
        window.location.href = 'login.html';
    }
});

document.addEventListener('DOMContentLoaded', cargarChats);