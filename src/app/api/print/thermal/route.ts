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

    // Enviar a impresora térmica usando formato RAW
    if (process.platform === 'win32') {
      const fs = require('fs');
      const path = require('path');
      const { exec } = require('child_process');
      const tempDir = process.env.TEMP || 'C:\\Temp';
      
      // Guardar archivo de texto plano
      const tempFile = path.join(tempDir, `receipt_${Date.now()}.txt`);
      fs.writeFileSync(tempFile, body, 'utf8');
      
      // Usar notepad para imprimir con formato RAW (sin márgenes)
      // notepad /p imprime directamente sin mostrar diálogo
      const psCommand = `
        $printerName = (Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Default = TRUE").Name
        $content = Get-Content -Path "${tempFile}" -Raw
        
        # Crear objeto de impresora
        $printJob = Start-Job -ScriptBlock {
          param($printerName, $content, $tempFile)
          
          # Usar .NET para imprimir directo sin formato
          Add-Type -AssemblyName System.Drawing
          Add-Type -AssemblyName System.Windows.Forms
          
          $printDoc = New-Object System.Drawing.Printing.PrintDocument
          $printDoc.PrinterSettings.PrinterName = $printerName
          
          # Sin márgenes
          $printDoc.DefaultPageSettings.Margins = New-Object System.Drawing.Printing.Margins(0,0,0,0)
          
          $printDoc.add_PrintPage({
            param($sender, $ev)
            
            # Fuente monoespaciada pequeña (6pt para caber en 58mm)
            $font = New-Object System.Drawing.Font("Courier New", 8, [System.Drawing.FontStyle]::Regular)
            $brush = [System.Drawing.Brushes]::Black
            
            # Dibujar el texto
            $ev.Graphics.DrawString($content, $font, $brush, 0, 0)
            $ev.HasMorePages = $false
          })
          
          $printDoc.Print()
          $printDoc.Dispose()
        } -ArgumentList $printerName, $content, $tempFile
        
        Wait-Job $printJob | Out-Null
        Remove-Job $printJob
        Write-Host "OK"
      `.trim();
      
      const psScriptFile = path.join(tempDir, `print_${Date.now()}.ps1`);
      fs.writeFileSync(psScriptFile, psCommand, 'utf8');
      
      exec(`powershell -ExecutionPolicy Bypass -File "${psScriptFile}"`, (error: Error, stdout: string, stderr: string) => {
        if (error) {
          console.error('❌ Error en impresión:', error.message);
          if (stderr) console.error('stderr:', stderr);
        } else {
          console.log('✅ Recibo enviado a impresora');
          if (stdout) console.log('stdout:', stdout);
        }
        
        // Limpiar archivos temporales
        setTimeout(() => {
          try {
            if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
            if (fs.existsSync(psScriptFile)) fs.unlinkSync(psScriptFile);
            console.log('🗑️ Archivos temporales eliminados');
          } catch (e) {
            console.error('Error limpiando archivos:', e);
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
