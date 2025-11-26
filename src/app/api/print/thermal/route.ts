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

    // Enviar RAW directo a impresora térmica sin formato de Windows
    if (process.platform === 'win32') {
      const fs = require('fs');
      const path = require('path');
      const { exec } = require('child_process');
      const tempDir = process.env.TEMP || 'C:\\Temp';
      const tempFile = path.join(tempDir, `receipt_${Date.now()}.txt`);
      
      // Guardar contenido
      fs.writeFileSync(tempFile, body, 'utf8');
      
      // Script PowerShell para enviar datos RAW sin formato
      const psScript = `
Add-Type -TypeDefinition @"
using System;
using System.IO;
using System.Runtime.InteropServices;

public class RawPrinter {
    [StructLayout(LayoutKind.Sequential, CharSet = CharSet.Ansi)]
    public class DOCINFOA {
        [MarshalAs(UnmanagedType.LPStr)] public string pDocName;
        [MarshalAs(UnmanagedType.LPStr)] public string pOutputFile;
        [MarshalAs(UnmanagedType.LPStr)] public string pDataType;
    }

    [DllImport("winspool.Drv", EntryPoint = "OpenPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool OpenPrinter([MarshalAs(UnmanagedType.LPStr)] string szPrinter, out IntPtr hPrinter, IntPtr pd);

    [DllImport("winspool.Drv", EntryPoint = "ClosePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool ClosePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartDocPrinterA", SetLastError = true, CharSet = CharSet.Ansi, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartDocPrinter(IntPtr hPrinter, Int32 level, [In, MarshalAs(UnmanagedType.LPStruct)] DOCINFOA di);

    [DllImport("winspool.Drv", EntryPoint = "EndDocPrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndDocPrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "StartPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool StartPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "EndPagePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool EndPagePrinter(IntPtr hPrinter);

    [DllImport("winspool.Drv", EntryPoint = "WritePrinter", SetLastError = true, ExactSpelling = true, CallingConvention = CallingConvention.StdCall)]
    public static extern bool WritePrinter(IntPtr hPrinter, IntPtr pBytes, Int32 dwCount, out Int32 dwWritten);

    public static bool SendStringToPrinter(string printerName, string text) {
        IntPtr pUnmanagedBytes = IntPtr.Zero;
        try {
            byte[] bytes = System.Text.Encoding.Default.GetBytes(text);
            pUnmanagedBytes = Marshal.AllocCoTaskMem(bytes.Length);
            Marshal.Copy(bytes, 0, pUnmanagedBytes, bytes.Length);
            
            IntPtr hPrinter;
            DOCINFOA di = new DOCINFOA();
            di.pDocName = "Recibo";
            di.pDataType = "RAW";
            
            if (OpenPrinter(printerName, out hPrinter, IntPtr.Zero)) {
                if (StartDocPrinter(hPrinter, 1, di)) {
                    if (StartPagePrinter(hPrinter)) {
                        int dwWritten;
                        WritePrinter(hPrinter, pUnmanagedBytes, bytes.Length, out dwWritten);
                        EndPagePrinter(hPrinter);
                    }
                    EndDocPrinter(hPrinter);
                }
                ClosePrinter(hPrinter);
                return true;
            }
            return false;
        } finally {
            if (pUnmanagedBytes != IntPtr.Zero) {
                Marshal.FreeCoTaskMem(pUnmanagedBytes);
            }
        }
    }
}
"@

try {
    $printerName = (Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Default = TRUE").Name
    $content = Get-Content -Path "${tempFile}" -Raw -Encoding UTF8
    
    $result = [RawPrinter]::SendStringToPrinter($printerName, $content)
    
    if ($result) {
        Write-Host "OK"
    } else {
        Write-Error "Error enviando a impresora"
        exit 1
    }
} catch {
    Write-Error $_.Exception.Message
    exit 1
}
`.trim();
      
      const psScriptFile = path.join(tempDir, `print_${Date.now()}.ps1`);
      fs.writeFileSync(psScriptFile, psScript, 'utf8');
      
      exec(`powershell -ExecutionPolicy Bypass -File "${psScriptFile}"`, (error: Error, stdout: string, stderr: string) => {
        if (error) {
          console.error('❌ Error en impresión RAW:', error.message);
          if (stderr) console.error('stderr:', stderr);
        } else {
          console.log('✅ Recibo enviado RAW a impresora térmica');
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
          message: 'Recibo enviado RAW a impresora térmica',
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
