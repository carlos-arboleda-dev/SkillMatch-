# proyecto_asistencia/datos/generar_datos.py

import pandas as pd
import numpy as np
import os
import sys

# Asegurar que podemos importar config
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import config

def generar_dataset_simulado(
    total_participantes=None,
    tasa_error=None,
    tiempo_base_seg=None,
    numero_eventos=None
):
    """
    Simula un dataset realista de registros de asistencia a lo largo de múltiples eventos.
    """
    # Usar valores de configuración si no se proporcionan
    n_participantes = total_participantes if total_participantes is not None else config.TOTAL_PARTICIPANTES
    err_rate = tasa_error if tasa_error is not None else config.TASA_ERROR
    base_time = tiempo_base_seg if tiempo_base_seg is not None else config.TIEMPO_BASE_SEG
    n_eventos = numero_eventos if numero_eventos is not None else config.NUMERO_EVENTOS
    
    tasa_duplicados = 0.02  # ~2% de registros duplicados
    
    records = []
    
    # Simular evento por evento
    for evento_id in range(1, n_eventos + 1):
        for part_id in range(1, n_participantes + 1):
            # Determinar estado de asistencia
            # Probabilidades realistas: Presente (75%), Tardanza (15%), Ausente (10%)
            estado = np.random.choice(
                ['presente', 'tardanza', 'ausente'],
                p=[0.75, 0.15, 0.10]
            )
            
            if estado == 'ausente':
                # Si está ausente, no registra tiempo de entrada
                records.append({
                    'id_participante': part_id,
                    'estado_asistencia': 'ausente',
                    'tiempo_registro_seg': 0.0,
                    'hay_error': False,
                    'tiempo_extra_por_error': 0.0,
                    'registro_duplicado': False,
                    'evento_id': f"Sesion_{evento_id}"
                })
            else:
                # Presente o tardanza -> Registra asistencia
                # Simular tiempo con distribución normal ~base_time
                tiempo_reg = np.random.normal(loc=base_time, scale=base_time * 0.25)
                tiempo_reg = max(5.0, tiempo_reg)  # Evitar tiempos negativos o absurdamente bajos
                
                # Determinar si hay error
                hay_error = np.random.random() < err_rate
                tiempo_extra = 60.0 if hay_error else 0.0
                
                # Determinar si hay duplicado
                es_duplicado = np.random.random() < tasa_duplicados
                
                # Añadir registro principal
                records.append({
                    'id_participante': part_id,
                    'estado_asistencia': estado,
                    'tiempo_registro_seg': round(tiempo_reg, 2),
                    'hay_error': hay_error,
                    'tiempo_extra_por_error': tiempo_extra,
                    'registro_duplicado': False,
                    'evento_id': f"Sesion_{evento_id}"
                })
                
                # Si se duplicó, añadir un segundo registro idéntico (pero marcado como duplicado)
                if es_duplicado:
                    records.append({
                        'id_participante': part_id,
                        'estado_asistencia': estado,
                        'tiempo_registro_seg': round(tiempo_reg + np.random.uniform(1.0, 5.0), 2),
                        'hay_error': hay_error,
                        'tiempo_extra_por_error': tiempo_extra,
                        'registro_duplicado': True,
                        'evento_id': f"Sesion_{evento_id}"
                    })
                    
    # Crear el DataFrame de Pandas
    df = pd.DataFrame(records)
    return df

def calcular_metricas_pandas(df, total_participantes=None):
    """
    Calcula las métricas solicitadas usando Pandas:
    1. tiempo_total_evento = suma de tiempos_registro + tiempos_extra_por_error
    2. porcentaje_asistencia = presentes / inscritos * 100
    3. tasa_precision = 1 - (errores + duplicados) / total_registros
    """
    n_participantes = total_participantes if total_participantes is not None else config.TOTAL_PARTICIPANTES
    
    metricas_eventos = []
    
    # Agrupar por cada evento_id
    grouped = df.groupby('evento_id')
    
    for name, group in grouped:
        # 1. Tiempo total de procesamiento del evento
        # Sumamos tiempo_registro_seg y tiempo_extra_por_error
        tiempo_total_evento = group['tiempo_registro_seg'].sum() + group['tiempo_extra_por_error'].sum()
        
        # 2. Porcentaje de asistencia
        # Participantes que están "presente" o "tardanza" (sin duplicados)
        asistentes_unicos = group[group['estado_asistencia'].isin(['presente', 'tardanza'])]['id_participante'].nunique()
        porcentaje_asistencia = (asistentes_unicos / n_participantes) * 100
        
        # 3. Tasa de precisión
        # errores + duplicados
        errores = group['hay_error'].sum()
        duplicados = group['registro_duplicado'].sum()
        total_registros = len(group)
        
        tasa_precision = 1.0 - ((errores + duplicados) / total_registros) if total_registros > 0 else 1.0
        tasa_precision = max(0.0, tasa_precision)  # Acotar a 0 en caso extremo
        
        metricas_eventos.append({
            'evento_id': name,
            'tiempo_total_evento_seg': round(tiempo_total_evento, 2),
            'porcentaje_asistencia': round(porcentaje_asistencia, 2),
            'tasa_precision': round(tasa_precision, 4),
            'total_registros': total_registros,
            'errores': int(errores),
            'duplicados': int(duplicados),
            'asistentes': int(asistentes_unicos)
        })
        
    df_metricas = pd.DataFrame(metricas_eventos)
    
    # Asegurar el orden correcto de las sesiones (Sesion_1, Sesion_2, etc.)
    # Extraemos el número para ordenar numéricamente
    df_metricas['num_sesion'] = df_metricas['evento_id'].str.extract(r'(\d+)').astype(int)
    df_metricas = df_metricas.sort_values('num_sesion').drop(columns=['num_sesion']).reset_index(drop=True)
    
    return df_metricas

if __name__ == "__main__":
    # Test rápido de generación
    print("Simulando datos...")
    df = generar_dataset_simulado(30, 0.05, 30, 5)
    print(f"Dataset simulado con {len(df)} registros.")
    print("\nPrevisualización de datos:")
    print(df.head(10))
    
    print("\nCalculando métricas con Pandas:")
    metricas = calcular_metricas_pandas(df, 30)
    print(metricas)
