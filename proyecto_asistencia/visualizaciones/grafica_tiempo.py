# proyecto_asistencia/visualizaciones/grafica_tiempo.py

import matplotlib.pyplot as plt
import numpy as np
import os
import sys

# Asegurar importación de config y generar_datos
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))
from datos.generar_datos import generar_dataset_simulado, calcular_metricas_pandas
import config

# Color palette for dark premium charts
BG_COLOR = '#0d0b14'
FIG_BG_COLOR = '#08070d'
TEXT_COLOR = '#f3e8ff'
PURPLE_PRIMARY = '#8a2be2'
PURPLE_LIGHT = '#b388ff'
CYAN_ACCENT = '#00e5ff'
GRID_COLOR = '#252131'

def aplicar_estilo_oscuro(ax, title, xlabel, ylabel):
    """Aplica una estética premium oscura y morada al gráfico."""
    ax.set_facecolor(BG_COLOR)
    ax.grid(True, color=GRID_COLOR, linestyle='--', alpha=0.6)
    
    # Colores de títulos y etiquetas
    ax.set_title(title, fontsize=12, fontweight='bold', color=TEXT_COLOR, pad=15)
    ax.set_xlabel(xlabel, fontsize=10, color=TEXT_COLOR, labelpad=10)
    ax.set_ylabel(ylabel, fontsize=10, color=TEXT_COLOR, labelpad=10)
    
    # Bordes (spines)
    for spine in ax.spines.values():
        spine.set_color('#3d3550')
        spine.set_linewidth(1.2)
        
    # Ticks
    ax.tick_params(colors=TEXT_COLOR, labelsize=9)

def generar_grafica_tiempo_vs_n(output_path, base_time=None, err_rate=None):
    """
    Gráfica 1 — Tiempo total de procesamiento vs. N participantes
    Muestra cómo crece el tiempo según el tamaño del grupo (10 a 500 participantes).
    """
    n_rango = [10, 50, 100, 150, 200, 250, 300, 350, 400, 450, 500]
    tiempos = []
    
    # Parámetros por defecto
    b_time = base_time if base_time is not None else config.TIEMPO_BASE_SEG
    e_rate = err_rate if err_rate is not None else config.TASA_ERROR
    
    # Simular para cada N
    for n in n_rango:
        df_sim = generar_dataset_simulado(
            total_participantes=n,
            tasa_error=e_rate,
            tiempo_base_seg=b_time,
            numero_eventos=1
        )
        metricas = calcular_metricas_pandas(df_sim, total_participantes=n)
        # Tomar el tiempo total del primer evento simulado
        tiempos.append(metricas['tiempo_total_evento_seg'].iloc[0] / 60.0) # Convertir a minutos
        
    fig, ax = plt.subplots(figsize=(6.5, 4), facecolor=FIG_BG_COLOR)
    
    # Dibujar la línea de tendencia con un degradado de puntos
    ax.plot(n_rango, tiempos, color=PURPLE_PRIMARY, linewidth=2.5, marker='o', 
            markersize=6, markerfacecolor=CYAN_ACCENT, markeredgecolor=PURPLE_LIGHT, 
            label='Simulación')
    
    # Dibujar un sombreado sutil bajo la línea
    ax.fill_between(n_rango, tiempos, color=PURPLE_PRIMARY, alpha=0.15)
    
    aplicar_estilo_oscuro(
        ax, 
        title="Escalabilidad del Procesamiento\nTiempo Total vs. Número de Participantes",
        xlabel="Número de Participantes (N)",
        ylabel="Tiempo Total de Procesamiento (Minutos)"
    )
    
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=120, facecolor=FIG_BG_COLOR)
    plt.close()
    print(f"Gráfica 1 guardada en: {output_path}")

def generar_grafica_impacto_errores(output_path, total_participantes=None, base_time=None):
    """
    Gráfica 2 — Impacto de la tasa de errores en el tiempo total
    Compara el tiempo total con 0%, 5%, 10% y 20% de tasa de error.
    """
    tasas = [0.0, 0.05, 0.10, 0.20]
    tiempos = []
    
    n_part = total_participantes if total_participantes is not None else config.TOTAL_PARTICIPANTES
    b_time = base_time if base_time is not None else config.TIEMPO_BASE_SEG
    
    for t in tasas:
        # Generar 3 eventos y promediar para mayor estabilidad
        df_sim = generar_dataset_simulado(
            total_participantes=n_part,
            tasa_error=t,
            tiempo_base_seg=b_time,
            numero_eventos=3
        )
        metricas = calcular_metricas_pandas(df_sim, total_participantes=n_part)
        tiempos.append(metricas['tiempo_total_evento_seg'].mean() / 60.0) # Promedio en minutos
        
    fig, ax = plt.subplots(figsize=(6.5, 4), facecolor=FIG_BG_COLOR)
    
    # Etiquetas de las barras
    etiquetas = ['0% (Ideal)', '5% (Normal)', '10% (Alta)', '20% (Crítica)']
    
    # Paleta de degradado de morado a fucsia/rojo neón
    colores = ['#4b1d8a', '#7b2cbf', '#9d4edd', '#ff007f']
    
    barras = ax.bar(etiquetas, tiempos, color=colores, width=0.55, edgecolor=PURPLE_LIGHT, linewidth=1)
    
    # Mostrar el valor en texto encima de cada barra
    for bar in barras:
        yval = bar.get_height()
        ax.text(
            bar.get_x() + bar.get_width()/2.0, 
            yval + max(0.05, max(tiempos)*0.02), 
            f"{round(yval, 2)}m", 
            ha='center', 
            va='bottom', 
            color=TEXT_COLOR, 
            fontsize=9,
            fontweight='bold'
        )
        
    aplicar_estilo_oscuro(
        ax,
        title=f"Impacto de Errores en el Tiempo Total\n(Para {n_part} participantes a {b_time}s base)",
        xlabel="Tasa de Error Configurada",
        ylabel="Tiempo Total de Procesamiento (Minutos)"
    )
    
    # Dar un margen superior adicional en el eje Y para las etiquetas
    ax.set_ylim(0, max(tiempos) * 1.15)
    
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=120, facecolor=FIG_BG_COLOR)
    plt.close()
    print(f"Gráfica 2 guardada en: {output_path}")

if __name__ == "__main__":
    # Test local
    generar_grafica_tiempo_vs_n("test_grafica1.png")
    generar_grafica_impacto_errores("test_grafica2.png")
