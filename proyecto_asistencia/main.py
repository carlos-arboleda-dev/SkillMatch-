# proyecto_asistencia/main.py

import os
import sys
import argparse
import json
import pandas as pd

# Asegurar importación de subdirectorios
sys.path.append(os.path.abspath(os.path.dirname(__file__)))
from datos.generar_datos import generar_dataset_simulado, calcular_metricas_pandas
from visualizaciones.grafica_tiempo import generar_grafica_tiempo_vs_n, generar_grafica_impacto_errores
from visualizaciones.grafica_estados import generar_grafica_distribucion_estados
from visualizaciones.grafica_precision import generar_grafica_precision_temporal
from visualizaciones.grafica_reportes import generar_grafica_tiempo_reporte
import config

def calcular_alertas_inasistencia(df, n_participantes, umbral):
    """
    Calcula qué participantes tienen inasistencias (estado == 'ausente')
    consecutivas que igualan o superan el UMBRAL_ALERTAS.
    """
    # Extraer el número de sesión para ordenar cronológicamente
    df_temp = df.copy()
    df_temp['num_sesion'] = df_temp['evento_id'].str.extract(r'(\d+)').astype(int)
    df_sorted = df_temp.sort_values(by=['id_participante', 'num_sesion'])
    
    alertas = []
    
    for part_id in range(1, n_participantes + 1):
        estados = df_sorted[df_sorted['id_participante'] == part_id]['estado_asistencia'].tolist()
        
        max_racha = 0
        racha_actual = 0
        
        for estado in estados:
            if estado == 'ausente':
                racha_actual += 1
                max_racha = max(max_racha, racha_actual)
            else:
                racha_actual = 0
                
        if max_racha >= umbral:
            alertas.append({
                'id_participante': int(part_id),
                'inasistencias_consecutivas': int(max_racha)
            })
            
    return alertas

def main():
    parser = argparse.ArgumentParser(description="Simulador de Asistencia y Generación de Reportes")
    
    parser.add_argument('--total_participantes', type=int, default=config.TOTAL_PARTICIPANTES,
                        help="Número total de participantes registrados")
    parser.add_argument('--tasa_error', type=float, default=config.TASA_ERROR,
                        help="Tasa de error en los registros de asistencia")
    parser.add_argument('--tiempo_base_seg', type=int, default=config.TIEMPO_BASE_SEG,
                        help="Tiempo promedio base en segundos")
    parser.add_argument('--umbral_alertas', type=int, default=config.UMBRAL_ALERTAS,
                        help="Umbral de faltas consecutivas para alertas")
    parser.add_argument('--ventana_registro_min', type=int, default=config.VENTANA_REGISTRO_MIN,
                        help="Ventana de registro en minutos")
    parser.add_argument('--numero_eventos', type=int, default=config.NUMERO_EVENTOS,
                        help="Cantidad de eventos a simular")
    parser.add_argument('--output_dir', type=str, default=None,
                        help="Directorio de salida para los assets de la web")
    
    args = parser.parse_args()
    
    # Resolver directorio de salida
    if args.output_dir is None:
        # Por defecto, guardar en frontend/assets
        base_dir = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(base_dir, 'frontend', 'assets')
    else:
        output_dir = args.output_dir
        
    os.makedirs(output_dir, exist_ok=True)
    graphs_dir = os.path.join(output_dir, 'graphs')
    os.makedirs(graphs_dir, exist_ok=True)
    
    print("=" * 60)
    print(">>> EJECUTANDO FLUJO DE SIMULACION DE ASISTENCIA")
    print(f"   Participantes: {args.total_participantes}")
    print(f"   Tasa de Error: {args.tasa_error * 100}%")
    print(f"   Tiempo Base: {args.tiempo_base_seg} seg")
    print(f"   Eventos: {args.numero_eventos}")
    print(f"   Umbral Alertas: {args.umbral_alertas} faltas consecutivas")
    print("=" * 60)
    
    # 1. Simulación de Datos (Fase 1)
    print("\n[Fase 1] Generando dataset simulado en Pandas...")
    df = generar_dataset_simulado(
        total_participantes=args.total_participantes,
        tasa_error=args.tasa_error,
        tiempo_base_seg=args.tiempo_base_seg,
        numero_eventos=args.numero_eventos
    )
    
    # Calcular métricas individuales de eventos
    df_metricas = calcular_metricas_pandas(df, total_participantes=args.total_participantes)
    
    # Calcular alertas de inasistencia
    alertas = calcular_alertas_inasistencia(df, args.total_participantes, args.umbral_alertas)
    
    # Calcular métricas consolidadas
    asistencias_totales = df[df['estado_asistencia'].isin(['presente', 'tardanza'])]
    presentes_netos = len(df[df['estado_asistencia'] == 'presente'])
    tardanzas_netas = len(df[df['estado_asistencia'] == 'tardanza'])
    ausencias_netas = len(df[df['estado_asistencia'] == 'ausente'])
    
    precision_media = df_metricas['tasa_precision'].mean()
    asistencia_media = df_metricas['porcentaje_asistencia'].mean()
    tiempo_total_procesamiento = df['tiempo_registro_seg'].sum() + df['tiempo_extra_por_error'].sum()
    
    errores_totales = int(df['hay_error'].sum())
    duplicados_totales = int(df['registro_duplicado'].sum())
    
    print("\n--- METRICAS CONSOLIDADAS ---")
    print(f"   - Tasa Asistencia Promedio: {round(asistencia_media, 2)}%")
    print(f"   - Tasa Precision Promedio: {round(precision_media * 100, 2)}%")
    print(f"   - Tiempo Total Procesamiento: {round(tiempo_total_procesamiento / 60, 2)} minutos")
    print(f"   - Total Errores: {errores_totales} | Duplicados: {duplicados_totales}")
    print(f"   - Alertas Generadas (consecutivas >= {args.umbral_alertas}): {len(alertas)}")
    
    # 2. Generación de Visualizaciones (Fase 2)
    print("\n[Fase 2] Generando visualizaciones con Matplotlib...")
    
    # Gráfica 1
    grafica1_path = os.path.join(graphs_dir, 'grafica1.png')
    generar_grafica_tiempo_vs_n(grafica1_path, base_time=args.tiempo_base_seg, err_rate=args.tasa_error)
    
    # Gráfica 2
    grafica2_path = os.path.join(graphs_dir, 'grafica2.png')
    generar_grafica_impacto_errores(grafica2_path, total_participantes=args.total_participantes, base_time=args.tiempo_base_seg)
    
    # Gráfica 3
    grafica3_path = os.path.join(graphs_dir, 'grafica3.png')
    generar_grafica_distribucion_estados(df, grafica3_path)
    
    # Gráfica 4
    grafica4_path = os.path.join(graphs_dir, 'grafica4.png')
    generar_grafica_precision_temporal(df_metricas, grafica4_path)
    
    # Gráfica 5
    grafica5_path = os.path.join(graphs_dir, 'grafica5.png')
    generar_grafica_tiempo_reporte(grafica5_path)
    
    # 3. Exportar Datos
    print("\n[Fase 3] Guardando reportes y archivos de resultados...")
    
    # Exportar CSV del dataset completo
    csv_path = os.path.join(output_dir, 'dataset.csv')
    df.to_csv(csv_path, index=False)
    print(f"   - Dataset CSV exportado a: {csv_path}")
    
    # Formatear muestra para visualización web (primeras 20 filas)
    preview_df = df.head(20).copy()
    # Remplazar valores NaN o vacíos por formatos limpios
    preview_data = preview_df.to_dict(orient='records')
    
    # Crear json consolidado
    summary_data = {
        'parametros': {
            'total_participantes': args.total_participantes,
            'tasa_error': args.tasa_error,
            'tiempo_base_seg': args.tiempo_base_seg,
            'umbral_alertas': args.umbral_alertas,
            'ventana_registro_min': args.ventana_registro_min,
            'numero_eventos': args.numero_eventos
        },
        'resumen': {
            'asistencia_promedio_pct': round(asistencia_media, 2),
            'precision_promedio_pct': round(precision_media * 100, 2),
            'tiempo_total_procesamiento_seg': round(tiempo_total_procesamiento, 2),
            'tiempo_total_procesamiento_min': round(tiempo_total_procesamiento / 60.0, 2),
            'errores_totales': errores_totales,
            'duplicados_totales': duplicados_totales,
            'total_registros': len(df),
            'distribucion': {
                'presentes': presentes_netos,
                'tardanzas': tardanzas_netas,
                'ausentes': ausencias_netas
            }
        },
        'alertas': alertas,
        'preview': preview_data
    }
    
    summary_path = os.path.join(output_dir, 'summary.json')
    with open(summary_path, 'w', encoding='utf-8') as f:
        json.dump(summary_data, f, ensure_ascii=False, indent=2)
    print(f"   - Resumen JSON exportado a: {summary_path}")
    
    print("\n*** FLUJO COMPLETADO CON EXITO ***")
    print("=" * 60)

if __name__ == "__main__":
    main()
