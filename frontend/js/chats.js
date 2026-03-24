// frontend/js/chats.js
const API_URL = 'http://localhost:3000/api';
const token = localStorage.getItem('token');

if (!token) window.location.href = 'login.html';

let currentChat = null;
let chats = [];

// Obtener iniciales de un nombre
function obtenerIniciales(nombre) {
    if (!nombre) return '?';
    return nombre.split(' ').map(word => word[0].toUpperCase()).slice(0, 2).join('');
}

// Cargar lista de chats
async function cargarChats() {
    try {
        console.log('🔄 Cargando chats...');
        
        // Obtener amigos (aceptados)
        const amigosResponse = await fetch(`${API_URL}/amistades/amigos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const amigosData = await amigosResponse.json();
        console.log('Amigos:', amigosData);
        
        // Obtener proyectos donde participa
        const proyectosResponse = await fetch(`${API_URL}/proyectos/mis-proyectos`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        const proyectosData = await proyectosResponse.json();
        console.log('Proyectos:', proyectosData);
        
        chats = [];
        
        // Agregar amigos a la lista de chats
        if (amigosData.success && amigosData.amigos && amigosData.amigos.length > 0) {
            amigosData.amigos.forEach(amigo => {
                chats.push({
                    id: `amigo-${amigo.id}`,
                    tipo: 'amigo',
                    nombre: amigo.nombre_completo,
                    codigo: amigo.codigo_estudiantil,
                    usuarioId: amigo.id
                });
            });
        }
        
        // Agregar proyectos a la lista de chats
        if (proyectosData && proyectosData.length > 0) {
            proyectosData.forEach(proyecto => {
                chats.push({
                    id: `proyecto-${proyecto.id}`,
                    tipo: 'proyecto',
                    nombre: proyecto.nombre,
                    proyectoId: proyecto.id
                });
            });
        }
        
        console.log('Chats cargados:', chats);
        renderizarChats();
        
    } catch (error) {
        console.error('Error cargando chats:', error);
    }
    
    actualizarBadgeNotificaciones();
}

// Renderizar lista de chats
function renderizarChats() {
    const chatsList = document.getElementById('chatsList');
    
    if (chats.length === 0) {
        chatsList.innerHTML = '<div style="padding: 2rem; text-align: center; color: #6c757d;"><p>No hay chats disponibles. Agrega amigos o únete a proyectos.</p></div>';
        return;
    }

    chatsList.innerHTML = chats.map(chat => `
        <div class="chat-item ${currentChat?.id === chat.id ? 'active' : ''}" onclick="seleccionarChat('${chat.id}')">
            <div class="chat-avatar">${obtenerIniciales(chat.nombre)}</div>
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
window.seleccionarChat = async function(chatId) {
    currentChat = chats.find(c => c.id === chatId);
    renderizarChats();
    await cargarMensajes();
};

// Cargar mensajes del chat
async function cargarMensajes() {
    const chatWindow = document.getElementById('chatWindow');
    
    if (!currentChat) return;

    console.log('📂 Cargando mensajes para chat:', currentChat.id);

    chatWindow.innerHTML = `
        <div class="chat-header">
            <div class="chat-header-info">
                <h5>${escapeHtml(currentChat.nombre)}</h5>
                <p>${currentChat.tipo === 'amigo' ? 'Conversación privada' : 'Chat del proyecto'}</p>
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

    // Permitir enviar con Enter
    document.getElementById('messageInput')?.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            enviarMensaje();
        }
    });

    // Cargar mensajes reales
    try {
        const response = await fetch(`${API_URL}/mensajes/${currentChat.id}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        const data = await response.json();
        console.log('📥 Mensajes recibidos:', data);
        
        if (data.success) {
            const container = document.getElementById('messagesContainer');
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            
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
                    const esMiMensaje = m.usuario_id === user.id;
                    console.log(`Mensaje de ${m.autor_nombre} (${m.usuario_id}) vs yo (${user.id}) -> ${esMiMensaje ? 'mío' : 'de otro'}`);
                    
                    return `
                        <div class="message ${esMiMensaje ? 'sent' : 'received'}">
                            <div class="message-bubble">
                                ${escapeHtml(m.mensaje)}
                                <div class="message-time">
                                    ${m.autor_nombre} • ${formatearFecha(m.created_at)}
                                </div>
                            </div>
                        </div>
                    `;
                }).join('');
                
                // Scroll al final
                container.scrollTop = container.scrollHeight;
            }
        }
    } catch (error) {
        console.error('Error cargando mensajes:', error);
        document.getElementById('messagesContainer').innerHTML = `
            <div class="alert alert-danger">
                Error al cargar mensajes
            </div>
        `;
    }
}

// Enviar mensaje
window.enviarMensaje = async function() {
    const input = document.getElementById('messageInput');
    const mensaje = input?.value.trim();

    if (!mensaje || !currentChat) return;

    console.log('📤 Enviando mensaje a:', currentChat.id, 'Mensaje:', mensaje);

    // Mostrar el mensaje temporalmente
    const container = document.getElementById('messagesContainer');
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    
    const tempId = Date.now();
    const tempMsg = `
        <div class="message sent" data-temp="${tempId}">
            <div class="message-bubble">
                ${escapeHtml(mensaje)}
                <div class="message-time">
                    Tú • Enviando...
                </div>
            </div>
        </div>
    `;
    
    container.innerHTML += tempMsg;
    input.value = '';
    container.scrollTop = container.scrollHeight;

    try {
        const response = await fetch(`${API_URL}/mensajes`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({
                chat_id: currentChat.id,
                mensaje: mensaje
            })
        });
        
        const data = await response.json();
        console.log('📥 Respuesta:', data);
        
        if (data.success) {
            // Recargar mensajes
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

// Función para escapar HTML
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Formatear fecha
function formatearFecha(fecha) {
    const d = new Date(fecha);
    const hoy = new Date();
    const diff = hoy - d;
    const minutos = Math.floor(diff / 60000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (minutos < 1440) return `Hace ${Math.floor(minutos/60)} h`;
    return `${d.getDate()}/${d.getMonth()+1} ${d.getHours().toString().padStart(2,'0')}:${d.getMinutes().toString().padStart(2,'0')}`;
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

// Cerrar sesión - actualizado para registrar logout
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
            // Registrar logout en el backend
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${token}` }
            });
        } catch (error) {
            console.error('Error registrando logout:', error);
        }
        
        // Limpiar localStorage y redirigir
        localStorage.clear();
        window.location.href = 'login.html';
    }
});

// Inicializar
document.addEventListener('DOMContentLoaded', function() {
    cargarChats();
});