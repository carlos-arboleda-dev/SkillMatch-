# proyecto_asistencia/config.py

# Parámetros configurables de la simulación de asistencia
TOTAL_PARTICIPANTES = 30       # Número total de personas registradas/inscritas (hasta 500)
TASA_ERROR = 0.05              # Tasa de fallas/errores en el registro (5%)
TIEMPO_BASE_SEG = 30           # Tiempo promedio base de registro por persona (en segundos)
UMBRAL_ALERTAS = 3             # Número de inasistencias consecutivas para disparar alertas
VENTANA_REGISTRO_MIN = 15      # Minutos de anticipación en los que se abre la ventana de registro
NUMERO_EVENTOS = 10            # Cantidad de eventos/sesiones a simular
