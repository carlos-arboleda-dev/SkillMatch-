# proyecto_asistencia/visualizaciones/grafica_precision.py

import matplotlib.pyplot as plt
import numpy as np
import os
import sys

# Asegurar importación de config y generar_datos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
import config

FIG_BG_COLOR = '#08070d'
BG_COLOR = '#0d0b14'
TEXT_COLOR = '#f3e8ff'
PURPLE_PRIMARY = '#8a2be2'
PURPLE_LIGHT = '#b388ff'
CYAN_ACCENT = '#00e5ff'
GRID_COLOR = '#252131'

def generar_grafica_precision_temporal(df_metricas, output_path):
    """
    Gráfica 4 — Precisión del registro a lo largo del tiempo
    Muestra la evolución de la tasa de precisión sesión a sesión.
    Permite visualizar si el sistema mejora o se degrada.
    """
    fig, ax = plt.subplots(figsize=(6.5, 4), facecolor=FIG_BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    
    # Extraer datos de la sesión
    sesiones = df_metricas['evento_id']
    # Acortar etiquetas para que no se amontonen (ej. Sesion_1 -> S1)
    etiquetas_cortas = [s.replace('Sesion_', 'S') for s in sesiones]
    precision = df_metricas['tasa_precision'] * 100 # Mostrar como porcentaje (0-100%)
    
    # Dibujar la línea de precisión con estilo brillante
    ax.plot(
        etiquetas_cortas, 
        precision, 
        color=CYAN_ACCENT, 
        linewidth=2.2, 
        marker='o', 
        markersize=6, 
        markerfacecolor=PURPLE_PRIMARY, 
        markeredgecolor=CYAN_ACCENT,
        label='Tasa de Precisión'
    )
    
    # Sombreado sutil bajo la curva
    ax.fill_between(etiquetas_cortas, precision, color=CYAN_ACCENT, alpha=0.1)
    
    # Línea de referencia del 100% de precisión (ideal)
    ax.axhline(y=100.0, color='#10b981', linestyle=':', linewidth=1.2, alpha=0.7, label='100% (Ideal)')
    
    # Calcular y dibujar la media histórica de precisión
    precision_media = precision.mean()
    ax.axhline(
        y=precision_media, 
        color=PURPLE_LIGHT, 
        linestyle='--', 
        linewidth=1.2, 
        alpha=0.8, 
        label=f'Promedio: {round(precision_media, 1)}%'
    )
    
    # Aplicar estilos
    ax.grid(True, color=GRID_COLOR, linestyle='--', alpha=0.6)
    
    # Colores de títulos y etiquetas
    ax.set_title(
        "Evolución Temporal de la Precisión del Registro\n(Porcentaje de registros correctos, excluyendo errores y duplicados)", 
        fontsize=11, 
        fontweight='bold', 
        color=TEXT_COLOR, 
        pad=15
    )
    ax.set_xlabel("Sesiones / Eventos Simulados", fontsize=10, color=TEXT_COLOR, labelpad=10)
    ax.set_ylabel("Tasa de Precisión (%)", fontsize=10, color=TEXT_COLOR, labelpad=10)
    
    # Ajustar límites del eje Y con un colchón para las leyendas e indicadores
    y_min = min(precision) - 5
    y_min = max(0.0, y_min) # Nunca menos de 0
    ax.set_ylim(y_min, 105.0)
    
    # Bordes
    for spine in ax.spines.values():
        spine.set_color('#3d3550')
        spine.set_linewidth(1.2)
        
    # Ticks
    ax.tick_params(colors=TEXT_COLOR, labelsize=9)
    
    # Mostrar leyenda
    ax.legend(
        loc='lower left',
        facecolor=BG_COLOR,
        edgecolor='#3d3550',
        labelcolor=TEXT_COLOR,
        fontsize=8
    )
    
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=120, facecolor=FIG_BG_COLOR)
    plt.close()
    print(f"Gráfica 4 guardada en: {output_path}")

if __name__ == "__main__":
    # Test local
    from datos.generar_datos import generar_dataset_simulado, calcular_metricas_pandas
    df_sim = generar_dataset_simulado(30, 0.05, 30, 10)
    metricas = calcular_metricas_pandas(df_sim, 30)
    generar_grafica_precision_temporal(metricas, "test_grafica4.png")
