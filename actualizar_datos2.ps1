# Script para actualizar los datos del dashboard desde el archivo de Excel copia (con '2' al final)
# Ejecuta este script en PowerShell si modificas el archivo copia, por ejemplo:
# BASE_ONBOARDING_ESCUELA_COMERCIAL (4) 2.xlsx o BASE_ONBOARDING_ESCUELA_COMERCIAL 2.xlsx

$excel = New-Object -ComObject Excel.Application
$excel.Visible = $false
$excel.DisplayAlerts = $false

function ExcelDateToDateString($excelDate) {
    if ($excelDate -eq $null -or $excelDate -eq "") { return "" }
    try {
        if ($excelDate -match '^\d+(\.\d+)?$') {
            $date = [datetime]"1899-12-30"
            $date = $date.AddDays([double]$excelDate)
            return $date.ToString("yyyy-MM-dd")
        }
    } catch {}
    return $excelDate
}

try {
    Write-Output "Iniciando lectura de archivos Excel copia..."
    
    # Intentar buscar el archivo copia con '2' al final
    $file2 = Get-Item "BASE_ONBOARDING_ESCUELA_COMERCIAL (4) 2.xlsx" -ErrorAction SilentlyContinue
    if (-not $file2) {
        $file2 = Get-Item "BASE_ONBOARDING_ESCUELA_COMERCIAL 2.xlsx" -ErrorAction SilentlyContinue
    }
    if (-not $file2) {
        $file2 = Get-Item "*2.xlsx" -ErrorAction SilentlyContinue | Select-Object -First 1
    }
    
    if (-not $file2) {
        Write-Error "No se encontró ningún archivo de Excel que termine en '2.xlsx' (ej. BASE_ONBOARDING_ESCUELA_COMERCIAL (4) 2.xlsx)"
        return
    }
    
    Write-Output "Archivo seleccionado: $($file2.Name)"
    $tempPath2 = "C:\Users\yeison_oyolat\.gemini\antigravity-cli\brain\a1d668f2-5a2e-45c7-8fa4-848e96332c55\scratch\base2_copia.xlsx"
    Copy-Item $file2.FullName $tempPath2 -Force
    
    $wb2 = $excel.Workbooks.Open($tempPath2)
    
    # 1. Exportar la pestaña "Registro"
    $sheetReg = $wb2.Sheets.Item("Registro")
    $registroData = @()
    if ($sheetReg) {
        $headers = @()
        for ($col = 1; $col -le 40; $col++) {
            $val = $sheetReg.Cells.Item(1, $col).Value2
            if ($val -eq $null -or $val -eq "") { break }
            $headers += $val
        }
        
        for ($row = 2; $row -le 200; $row++) {
            $noVal = $sheetReg.Cells.Item($row, 1).Value2
            if ($noVal -eq $null -or $noVal -eq "") { break }
            
            $rowObj = [ordered]@{}
            for ($col = 1; $col -le $headers.Length; $col++) {
                $h = $headers[$col-1]
                $val = $sheetReg.Cells.Item($row, $col).Value2
                if ($val -eq $null) { $val = "" }
                
                # Formatear la fecha
                if ($h -like "*FECHA*") {
                    $val = ExcelDateToDateString $val
                }
                
                $rowObj[$h] = $val
            }
            $registroData += $rowObj
        }
    }
    
    # 2. Exportar la pestaña "OJT"
    $sheetOJT = $wb2.Sheets.Item("OJT")
    $ojtData = @()
    if ($sheetOJT) {
        $headers = @()
        for ($col = 1; $col -le 40; $col++) {
            $val = $sheetOJT.Cells.Item(1, $col).Value2
            if ($val -eq $null -or $val -eq "") { break }
            $headers += $val
        }
        
        for ($row = 2; $row -le 200; $row++) {
            $docVal = $sheetOJT.Cells.Item($row, 1).Value2
            if ($docVal -eq $null -or $docVal -eq "") {
                $nameVal = $sheetOJT.Cells.Item($row, 2).Value2
                if ($nameVal -eq $null -or $nameVal -eq "") { break }
            }
            
            $rowObj = [ordered]@{}
            for ($col = 1; $col -le $headers.Length; $col++) {
                $h = $headers[$col-1]
                $val = $sheetOJT.Cells.Item($row, $col).Value2
                if ($val -eq $null) { $val = "" }
                
                if ($h -like "*FECHA*") {
                    $val = ExcelDateToDateString $val
                }
                $rowObj[$h] = $val
            }
            $ojtData += $rowObj
        }
    }
    
    # 3. Exportar la pestaña "OJT 2" (Seguimiento diario de OJT)
    $sheetOJT2 = $wb2.Sheets.Item("OJT 2")
    $ojt2Data = @()
    if ($sheetOJT2) {
        $headers = @()
        for ($col = 1; $col -le 40; $col++) {
            $val = $sheetOJT2.Cells.Item(1, $col).Value2
            if ($val -eq $null -or $val -eq "") { break }
            $headers += $val
        }
        
        for ($row = 2; $row -le 500; $row++) {
            $docVal = $sheetOJT2.Cells.Item($row, 2).Value2
            if ($docVal -eq $null -or $docVal -eq "") { break }
            
            $rowObj = [ordered]@{}
            for ($col = 1; $col -le $headers.Length; $col++) {
                $h = $headers[$col-1]
                $val = $sheetOJT2.Cells.Item($row, $col).Value2
                if ($val -eq $null) { $val = "" }
                
                if ($h -like "*FECHA*") {
                    $val = ExcelDateToDateString $val
                }
                $rowObj[$h] = $val
            }
            $ojt2Data += $rowObj
        }
    }
    
    $wb2.Close($false)
    if (Test-Path $tempPath2) { Remove-Item $tempPath2 -Force }
    
    # Crear objeto de salida completo
    $output = [ordered]@{
        "registro" = $registroData
        "ojt" = $ojtData
        "ojt_diario" = $ojt2Data
        "actualizado" = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    }
    
    # Convertir a JSON
    $json = ConvertTo-Json $output -Depth 10
    
    # Generar data2.js en el directorio actual
    $jsContent = "const ONBOARDING_DATA = " + $json + ";"
    $jsContent | Out-File -FilePath "data2.js" -Encoding utf8
    
    Write-Output "========================================================="
    Write-Output "¡DATOS DE LA COPIA 2 ACTUALIZADOS CON ÉXITO!"
    Write-Output "Se ha guardado el archivo 'data2.js' con:"
    Write-Output " - Registro (Participantes): $($registroData.Count) registros"
    Write-Output " - OJT (Aprobados): $($ojtData.Count) registros"
    Write-Output " - OJT Diario (Seguimiento): $($ojt2Data.Count) registros"
    Write-Output "========================================================="
}
catch {
    Write-Error "Error al procesar el archivo Excel copia: $_"
}
finally {
    $excel.Quit()
    [System.Runtime.Interopservices.Marshal]::ReleaseComObject($excel) | Out-Null
}
