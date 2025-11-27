/**
 * Servidor local de impresión térmica
 * Corre en tu PC y recibe comandos desde Vercel para imprimir
 */

const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = 3001;

// Permitir requests desde Vercel
app.use(cors({
  origin: ['http://localhost:3000', 'https://inventarios-app.vercel.app'],
  credentials: true
}));

app.use(express.text({ limit: '10mb' }));
app.use(express.json());

// Endpoint para imprimir
app.post('/print', async (req, res) => {
  try {
    const { content, printerName } = typeof req.body === 'string' 
      ? { content: req.body, printerName: null }
      : req.body;

    console.log('📄 Recibida solicitud de impresión');
    console.log('📊 Tamaño:', content.length, 'bytes');

    const tempDir = process.env.TEMP || 'C:\\Temp';
    const tempFile = path.join(tempDir, `receipt_${Date.now()}.txt`);
    
    // Guardar contenido
    fs.writeFileSync(tempFile, content, 'utf8');
    
    // Script PowerShell para enviar datos RAW
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
    $printerName = ${printerName ? `"${printerName}"` : '(Get-WmiObject -Query "SELECT * FROM Win32_Printer WHERE Default = TRUE").Name'}
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
    
    // Ejecutar PowerShell
    exec(`powershell -ExecutionPolicy Bypass -File "${psScriptFile}"`, (error, stdout, stderr) => {
      // Limpiar archivos temporales
      setTimeout(() => {
        try {
          if (fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
          if (fs.existsSync(psScriptFile)) fs.unlinkSync(psScriptFile);
        } catch (e) {
          console.error('Error limpiando archivos:', e);
        }
      }, 2000);

      if (error) {
        console.error('❌ Error:', error.message);
        return res.status(500).json({
          success: false,
          error: error.message,
          stderr
        });
      }

      console.log('✅ Impresión exitosa');
      res.json({
        success: true,
        message: 'Recibo impreso correctamente',
        stdout
      });
    });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'online',
    platform: process.platform,
    printer: 'POS-5890U-L'
  });
});

app.listen(PORT, () => {
  console.log('🖨️  Servidor de impresión térmica iniciado');
  console.log(`📡 Escuchando en http://localhost:${PORT}`);
  console.log('💻 Plataforma:', process.platform);
  console.log('✅ Listo para recibir trabajos de impresión desde Vercel');
});
