import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * API endpoint para imprimir recibos en impresora térmica POS-5890U-L
 * Recibe datos ESC/POS y los envía a la impresora USB
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await request.text();

    console.log('📄 Solicitud de impresión térmica recibida');
    console.log('📊 Tamaño de datos:', body.length, 'bytes');

    // OPCIÓN 1: Impresión directa con escpos-usb (requiere: npm install escpos escpos-usb)
    try {
      const escpos = require('escpos');
      escpos.USB = require('escpos-usb');

      // Buscar impresora USB POS-5890U-L
      const device = new escpos.USB();
      const printer = new escpos.Printer(device);

      await device.open(async (error: Error) => {
        if (error) {
          console.error('❌ Error abriendo impresora USB:', error);
          throw error;
        }

        printer
          .raw(Buffer.from(body, 'binary'))
          .close();

        console.log('✅ Recibo enviado a impresora POS-5890U-L');
      });

      return NextResponse.json(
        {
          success: true,
          message: 'Recibo impreso correctamente en POS-5890U-L',
          bytesEnviados: body.length
        },
        { status: 200 }
      );

    } catch (usbError) {
      console.warn('⚠️ Impresión USB no disponible, intentando método alternativo');
      
      // OPCIÓN 2: Fallback - Guardar en cola de impresión de Windows
      // Esto requiere que la impresora esté instalada como impresora de Windows
      if (process.platform === 'win32') {
        const fs = require('fs');
        const path = require('path');
        const tempDir = process.env.TEMP || 'C:\\Temp';
        const tempFile = path.join(tempDir, `receipt_${Date.now()}.prn`);
        
        // Guardar archivo temporal
        fs.writeFileSync(tempFile, body, 'binary');
        
        // Enviar a impresora usando comando de Windows
        const { exec } = require('child_process');
        exec(`print /D:"POS-5890" "${tempFile}"`, (error: Error) => {
          if (error) {
            console.error('❌ Error en impresión Windows:', error);
          } else {
            console.log('✅ Enviado a cola de impresión de Windows');
          }
          // Limpiar archivo temporal
          setTimeout(() => fs.unlinkSync(tempFile), 5000);
        });
        
        return NextResponse.json(
          {
            success: true,
            message: 'Recibo enviado a cola de impresión',
            bytesEnviados: body.length
          },
          { status: 200 }
        );
      }

      throw new Error('No se pudo conectar con la impresora');
    }

  } catch (error) {
    console.error('❌ Error en impresión térmica:', error);
    return NextResponse.json(
      {
        error: 'Error al imprimir recibo',
        details: error instanceof Error ? error.message : 'Error desconocido',
        solution: 'Verifica que la impresora POS-5890U-L esté conectada y encendida'
      },
      { status: 500 }
    );
  }
}
