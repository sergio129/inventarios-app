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

    // Enviar texto plano directamente a la impresora predeterminada de Windows
    if (process.platform === 'win32') {
      const fs = require('fs');
      const path = require('path');
      const { exec } = require('child_process');
      const tempDir = process.env.TEMP || 'C:\\Temp';
      const tempFile = path.join(tempDir, `receipt_${Date.now()}.txt`);
      
      // Guardar archivo temporal con texto plano
      fs.writeFileSync(tempFile, body, 'utf8');
      
      // Usar Out-Printer de PowerShell para enviar a impresora predeterminada
      const psCommand = `Get-Content -Path "${tempFile}" | Out-Printer`;
      
      exec(`powershell -Command "${psCommand}"`, (error: Error, stdout: string, stderr: string) => {
        if (error) {
          console.error('❌ Error en impresión:', error.message);
          if (stderr) console.error('stderr:', stderr);
        } else {
          console.log('✅ Recibo enviado a impresora');
          if (stdout) console.log('stdout:', stdout);
        }
        
        // Limpiar archivo temporal
        setTimeout(() => {
          try {
            if (fs.existsSync(tempFile)) {
              fs.unlinkSync(tempFile);
              console.log('🗑️ Archivo temporal eliminado');
            }
          } catch (e) {
            console.error('Error limpiando archivo:', e);
          }
        }, 3000);
      });
      
      return NextResponse.json(
        {
          success: true,
          message: 'Recibo enviado a impresora',
          bytesEnviados: body.length
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { error: 'Plataforma no soportada' },
      { status: 500 }
    );

  } catch (error) {
    console.error('❌ Error en impresión térmica:', error);
    return NextResponse.json(
      {
        error: 'Error al imprimir recibo',
        details: error instanceof Error ? error.message : 'Error desconocido'
      },
      { status: 500 }
    );
  }
}
