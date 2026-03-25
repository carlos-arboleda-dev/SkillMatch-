# TODO - Revisión de Proyectos Pendientes (Admin)

## ✅ Plan Aprobado
- Nueva pestaña "Proyectos Pendientes" en admin.html
- Listar proyectos con estado='pendiente'
- Botones Aceptar/Rechazar con notificaciones
- Preservar funcionalidad existente

## 📋 Pasos de Implementación

### Paso 1: Backend - Nuevas rutas [✅ COMPLETADO]
- Agregar GET /admin/proyectos-pendientes en adminroutes.js
- Agregar PUT /admin/proyectos/:id/revisar en adminroutes.js

### Paso 2: Backend - Controladores [✅ COMPLETADO]  
- obtenerProyectosPendientes() en adminController.js
- revisarProyecto() en adminController.js

### Paso 3: Frontend - HTML [✅ COMPLETADO]
- Nueva tab "Proyectos Pendientes" en admin.html

### Paso 4: Frontend - JavaScript [✅ COMPLETADO]
- cargarProyectosPendientes()
- revisarProyecto()
- UI para modal rechazo

### Paso 5: Fixes completos [✅ TERMINADO]
- ✅ Feed solo 'aprobado'
- ✅ Fix SQL revisarProyecto
- ✅ Refresh automático pestaña pendientes
- ✅ Estado badges en tabla Proyectos
- ✅ Auto-switch tab tras acción

---

**Estado actual: Paso 1 en progreso**

