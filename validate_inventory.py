#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import re

total_capital = 0
total_venta = 0
count_activos = 0
productos_lista = []

try:
    with open('E:\\Documentos\\inventario_2026-02-27 (4).txt', 'r', encoding='latin-1') as f:
        lines = f.readlines()

    # Procesar líneas de datos (saltando header)
    for i in range(1, len(lines)):
        linea = lines[i].rstrip()
        if not linea.strip():
            continue
            
        campos = linea.split('\t')
        
        if len(campos) >= 19:
            nombre = campos[0].strip()
            
            # Verificar activo (columna 18, índice 18 desde 0)
            activo = campos[18].strip() if len(campos) > 18 else ''
            
            # Buscar por "S" ya que puede estar dañado el encoding
            if nombre and (activo.startswith('S') or 'S' in activo[:2]):
                count_activos += 1
                
                try:
                    # Extraer valores numéricos de cada campo
                    stock_cajas = int(re.findall(r'\d+', campos[10] if len(campos) > 10 else '0')[0] or 0) if re.findall(r'\d+', campos[10] if len(campos) > 10 else '0') else 0
                    unidades_por_caja = int(re.findall(r'\d+', campos[11] if len(campos) > 11 else '0')[0] or 0) if re.findall(r'\d+', campos[11] if len(campos) > 11 else '0') else 0
                    stock_sueltas = int(re.findall(r'\d+', campos[12] if len(campos) > 12 else '0')[0] or 0) if re.findall(r'\d+', campos[12] if len(campos) > 12 else '0') else 0
                    
                    precio_venta = int(re.findall(r'\d+', campos[6] if len(campos) > 6 else '0')[0] or 0) if re.findall(r'\d+', campos[6] if len(campos) > 6 else '0') else 0
                    precio_compra = int(re.findall(r'\d+', campos[8] if len(campos) > 8 else '0')[0] or 0) if re.findall(r'\d+', campos[8] if len(campos) > 8 else '0') else 0
                    
                    stock_total = (stock_cajas * unidades_por_caja) + stock_sueltas
                    
                    if stock_total > 0:
                        capital = precio_compra * stock_total
                        venta = precio_venta * stock_total
                        total_capital += capital
                        total_venta += venta
                        
                        productos_lista.append({
                            'nombre': nombre[:30],
                            'stock': stock_total,
                            'precio_compra': precio_compra,
                            'precio_venta': precio_venta,
                            'capital': capital,
                            'venta': venta
                        })
                except Exception as e:
                    print(f"Error procesando línea {i}: {e}")
                    pass

    ganancia = total_venta - total_capital
    margen = (ganancia / total_venta * 100) if total_venta > 0 else 0

    print("\n" + "="*50)
    print("VALIDACIÓN DE VALORES DEL INVENTARIO")
    print("="*50 + "\n")
    
    print(f"Productos Activos encontrados: {count_activos}")
    print(f"Capital Invertido:              ${total_capital:>15,d}")
    print(f"Valor de Venta:                 ${total_venta:>15,d}")
    print(f"Ganancia Potencial:             ${ganancia:>15,d}")
    print(f"Margen:                         {margen:>15.2f}%")
    
    print("\n" + "="*50)
    print("VALORES DEL DASHBOARD (ACTUALES)")
    print("="*50 + "\n")
    print("Capital Invertido:              $ 34.972.811")
    print("Valor de Venta:                 $ 47.072.180")
    print("Ganancia Potencial:             $ 12.099.369")
    print("Margen:                             34.60%")
    
    print("\n" + "="*50)
    print("DIFERENCIAS")
    print("="*50 + "\n")
    
    capital_diff = total_capital - 34972811
    venta_diff = total_venta - 47072180
    ganancia_diff = ganancia - 12099369
    margen_diff = margen - 34.60
    
    print(f"Capital Invertido:              {capital_diff:>15,d} ({'+' if capital_diff >= 0 else ''}{capital_diff/34972811*100:.2f}%)")
    print(f"Valor de Venta:                 {venta_diff:>15,d} ({'+' if venta_diff >= 0 else ''}{venta_diff/47072180*100:.2f}%)")
    print(f"Ganancia Potencial:             {ganancia_diff:>15,d} ({'+' if ganancia_diff >= 0 else ''}{ganancia_diff/12099369*100:.2f}%)")
    print(f"Margen:                         {margen_diff:>15.2f}%")
    
    print("\n")
    
except Exception as e:
    print(f"Error general: {e}")
    import traceback
    traceback.print_exc()
