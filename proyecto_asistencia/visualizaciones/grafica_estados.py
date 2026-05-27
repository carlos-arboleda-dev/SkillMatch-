# proyecto_asistencia/visualizaciones/grafica_estados.py

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
FUCHSIA_ACCENT = '#d500f9'
DARK_MUTED = '#221b35'
BORDER_COLOR = '#3d3550'

def generar_grafica_distribucion_estados(df, output_path):
    """
    Gráfica 3 — Distribución de estados de asistencia
    Gráfico de rosca (donut chart) que muestra la distribución agregada
    de los estados: presente / ausente / tardanza para todo el dataset.
    """
    # Contar los estados, asegurando que existan los 3
    conteos = df['estado_asistencia'].value_counts()
    
    estados_posibles = ['presente', 'tardanza', 'ausente']
    valores = [conteos.get(est, 0) for est in estados_posibles]
    total = sum(valores)
    
    # Si no hay registros, poner un valor por defecto
    if total == 0:
        valores = [1, 0, 0]
    
    # Porcentajes para las etiquetas
    porcentajes = [v / total * 100 for v in valores]
    
    # Nombres en español
    labels_es = ['Presente', 'Tardanza', 'Ausente']
    
    # Colores premium: Púrpura (Presente), Fucsia (Tardanza), Morado Grisáceo Oscuro (Ausente)
    colores = [PURPLE_PRIMARY, FUCHSIA_ACCENT, DARK_MUTED]
    
    fig, ax = plt.subplots(figsize=(6.5, 4), facecolor=FIG_BG_COLOR)
    ax.set_facecolor(BG_COLOR)
    
    # Dibujar gráfico de pastel (con un hueco en medio para hacerlo donut)
    wedges, texts, autotexts = ax.pie(
        valores,
        labels=labels_es,
        autopct='%1.1f%%',
        startangle=90,
        colors=colores,
        pctdistance=0.75,
        textprops=dict(color=TEXT_COLOR, fontweight='bold', fontsize=9),
        wedgeprops=dict(width=0.4, edgecolor=BORDER_COLOR, linewidth=1.5)
    )
    
    # Estilo de las etiquetas de porcentaje
    for autotext in autotexts:
        autotext.set_fontsize(10)
        autotext.set_color('#ffffff')
        
    # Añadir un círculo en el centro para dar más robustez al efecto donut
    centre_circle = plt.Circle((0,0), 0.55, fc=FIG_BG_COLOR, edgecolor=BORDER_COLOR, linewidth=1.0)
    fig.gca().add_artist(centre_circle)
    
    # Añadir un texto central descriptivo
    ax.text(
        0, 0, 
        f"Total\n{total}\nreg.", 
        ha='center', 
        va='center', 
        color=TEXT_COLOR, 
        fontsize=10, 
        fontweight='bold'
    )
    
    # Título y ajustes
    ax.set_title(
        "Distribución Consolidada de Asistencia\n(Estado de los participantes en todas las sesiones)",
        fontsize=12, 
        fontweight='bold', 
        color=TEXT_COLOR, 
        pad=15
    )
    
    # Ajustar leyenda
    ax.legend(
        wedges, 
        [f"{l}: {v} ({round(p,1)}%)" for l, v, p in zip(labels_es, valores, porcentajes)],
        title="Detalles",
        loc="center left",
        bbox_to_anchor=(0.95, 0.5),
        facecolor=BG_COLOR,
        edgecolor=BORDER_COLOR,
        labelcolor=TEXT_COLOR,
        title_fontsize=9,
        fontsize=8
    )
    
    # Equal aspect ratio para asegurar que sea redondo
    ax.axis('equal')  
    
    plt.tight_layout()
    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    plt.savefig(output_path, dpi=120, facecolor=FIG_BG_COLOR, bbox_inches='tight')
    plt.close()
    print(f"Gráfica 3 guardada en: {output_path}")

if __name__ == "__main__":
    # Test local
    from datos.generar_datos import generar_dataset_simulado
    df_sim = generar_dataset_simulado(30, 0.05, 30, 10)
    generar_grafica_distribucion_estados(df_sim, "test_grafica3.png")
